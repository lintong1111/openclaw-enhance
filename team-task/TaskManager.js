/**
 * TaskManager - 任务管理模块
 * 任务状态机: pending → running → completed/failed/killed
 */

const { EventEmitter } = require('events');

const TASK_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  KILLED: 'killed'
};

const VALID_TRANSITIONS = {
  [TASK_STATUS.PENDING]: [TASK_STATUS.RUNNING, TASK_STATUS.KILLED],
  [TASK_STATUS.RUNNING]: [TASK_STATUS.COMPLETED, TASK_STATUS.FAILED, TASK_STATUS.KILLED],
  [TASK_STATUS.COMPLETED]: [],
  [TASK_STATUS.FAILED]: [],
  [TASK_STATUS.KILLED]: []
};

class TaskManager extends EventEmitter {
  constructor() {
    super();
    this.tasks = new Map();
    this.taskCounter = 0;
  }

  /**
   * 创建任务
   * @param {Object} config - 任务配置
   * @param {string} config.title - 任务标题
   * @param {string} config.description - 任务描述
   * @param {string} config.owner - 任务负责人
   * @param {string} [config.teamName] - 所属团队
   * @param {Object} [config.metadata] - 额外元数据
   */
  createTask({ title, description = '', owner = null, teamName = null, metadata = {} }) {
    const id = `task-${++this.taskCounter}`;
    const task = {
      id,
      title,
      description,
      owner,
      teamName,
      status: TASK_STATUS.PENDING,
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null,
      result: null,
      error: null,
      metadata
    };
    this.tasks.set(id, task);
    this.emit('task:created', task);
    return task;
  }

  /**
   * 更新任务状态
   * @param {string} taskId - 任务ID
   * @param {string} newStatus - 新状态
   * @param {Object} [extra] - 额外数据
   */
  updateStatus(taskId, newStatus, extra = {}) {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task "${taskId}" not found`);

    const currentStatus = task.status;
    const allowed = VALID_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid status transition: ${currentStatus} → ${newStatus}. ` +
        `Allowed: ${allowed.length ? allowed.join(', ') : 'none'}`
      );
    }

    task.status = newStatus;

    if (newStatus === TASK_STATUS.RUNNING) {
      task.startedAt = Date.now();
    } else if ([TASK_STATUS.COMPLETED, TASK_STATUS.FAILED, TASK_STATUS.KILLED].includes(newStatus)) {
      task.completedAt = Date.now();
    }

    if (extra.result) task.result = extra.result;
    if (extra.error) task.error = extra.error;

    this.emit('task:updated', task);
    this.emit(`task:${newStatus}`, task);

    return task;
  }

  /**
   * 开始执行任务
   * @param {string} taskId - 任务ID
   */
  startTask(taskId) {
    return this.updateStatus(taskId, TASK_STATUS.RUNNING);
  }

  /**
   * 完成任务
   * @param {string} taskId - 任务ID
   * @param {Object} result - 任务结果
   */
  completeTask(taskId, result = {}) {
    return this.updateStatus(taskId, TASK_STATUS.COMPLETED, { result });
  }

  /**
   * 标记任务失败
   * @param {string} taskId - 任务ID
   * @param {string} error - 错误信息
   */
  failTask(taskId, error) {
    return this.updateStatus(taskId, TASK_STATUS.FAILED, { error });
  }

  /**
   * 终止任务
   * @param {string} taskId - 任务ID
   */
  killTask(taskId) {
    return this.updateStatus(taskId, TASK_STATUS.KILLED);
  }

  /**
   * 获取任务
   * @param {string} taskId - 任务ID
   */
  getTask(taskId) {
    return this.tasks.get(taskId);
  }

  /**
   * 更新任务
   * @param {string} taskId - 任务ID
   * @param {Object} updates - 更新字段
   */
  updateTask(taskId, updates) {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task "${taskId}" not found`);

    // 禁止更新状态（用专门的 status 方法）
    const { status, ...rest } = updates;
    if (status && status !== task.status) {
      throw new Error('Use updateStatus() to change task status');
    }

    Object.assign(task, rest);
    this.emit('task:updated', task);
    return task;
  }

  /**
   * 列出任务
   * @param {Object} [filter] - 过滤条件 {status, owner, teamName}
   */
  listTasks(filter = {}) {
    let tasks = Array.from(this.tasks.values());

    if (filter.status) {
      tasks = tasks.filter(t => t.status === filter.status);
    }
    if (filter.owner) {
      tasks = tasks.filter(t => t.owner === filter.owner);
    }
    if (filter.teamName) {
      tasks = tasks.filter(t => t.teamName === filter.teamName);
    }

    return tasks.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * 获取任务统计
   * @param {string} [teamName] - 可选，按团队过滤
   */
  getStats(teamName = null) {
    let tasks = teamName
      ? Array.from(this.tasks.values()).filter(t => t.teamName === teamName)
      : Array.from(this.tasks.values());

    const stats = {
      total: tasks.length,
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      killed: 0
    };

    for (const task of tasks) {
      stats[task.status]++;
    }

    return stats;
  }

  /**
   * 删除任务
   * @param {string} taskId - 任务ID
   */
  deleteTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task "${taskId}" not found`);
    this.tasks.delete(taskId);
    this.emit('task:deleted', { id: taskId });
  }
}

module.exports = TaskManager;
module.exports.TASK_STATUS = TASK_STATUS;
