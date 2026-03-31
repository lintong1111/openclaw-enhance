/**
 * Coordinator - 协调器
 * 整合 TeamManager、TaskManager、MessageBus，统一协调多 Agent 协作
 */

const TeamManager = require('./TeamManager');
const TaskManager = require('./TaskManager');
const MessageBus = require('./MessageBus');
const { MESSAGE_TYPE } = require('./MessageBus');

class Coordinator {
  constructor() {
    this.teamManager = new TeamManager();
    this.taskManager = new TaskManager();
    this.messageBus = new MessageBus();

    // 绑定事件
    this._bindEvents();
  }

  _bindEvents() {
    // 任务创建时自动通知负责人
    this.taskManager.on('task:created', (task) => {
      if (task.owner) {
        this.messageBus.sendTaskAssignment(task.owner, task);
      }
    });

    // 任务状态变更时通知
    this.taskManager.on('task:updated', (task) => {
      if (task.owner) {
        this.messageBus.sendTaskUpdate(task.owner, {
          taskId: task.id,
          status: task.status,
          title: task.title
        });
      }
    });

    // 任务完成时通知
    this.taskManager.on('task:completed', (task) => {
      // 通知协调器（main agent）
      this.messageBus.send({
        type: MESSAGE_TYPE.TASK_COMPLETE,
        to: 'main',
        from: task.owner || 'unknown',
        content: `Task completed: ${task.title}`,
        payload: { taskId: task.id, result: task.result }
      });
    });

    // 团队成员添加时通知
    this.teamManager.on('member:added', ({ team, member }) => {
      const teamData = this.teamManager.getTeam(team);
      // 通知新成员加入
      this.messageBus.send({
        type: MESSAGE_TYPE.MESSAGE,
        to: member,
        from: 'coordinator',
        content: `You have been added to team: ${team}`,
        payload: { team: teamData }
      });
    });
  }

  // ========== Team 操作 ==========

  /**
   * 创建团队
   * @param {Object} config - 团队配置
   */
  createTeam(config) {
    return this.teamManager.createTeam(config);
  }

  /**
   * 删除团队
   * @param {string} name - 团队名称
   */
  deleteTeam(name) {
    // 清理团队相关任务
    const tasks = this.taskManager.listTasks({ teamName: name });
    for (const task of tasks) {
      this.taskManager.deleteTask(task.id);
    }
    return this.teamManager.deleteTeam(name);
  }

  /**
   * 获取团队信息
   * @param {string} name - 团队名称
   */
  getTeam(name) {
    const team = this.teamManager.getTeam(name);
    if (!team) return null;

    const tasks = this.taskManager.listTasks({ teamName: name });
    return {
      ...team,
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        owner: t.owner
      }))
    };
  }

  /**
   * 列出所有团队
   */
  listTeams() {
    return this.teamManager.listTeams();
  }

  /**
   * 添加团队成员
   * @param {string} teamName - 团队名称
   * @param {Object} member - 成员配置
   */
  addTeamMember(teamName, member) {
    return this.teamManager.addMember(teamName, member);
  }

  /**
   * 移除团队成员
   * @param {string} teamName - 团队名称
   * @param {string} memberName - 成员名称
   */
  removeTeamMember(teamName, memberName) {
    // 取消该成员的任务
    const tasks = this.taskManager.listTasks({ owner: memberName });
    for (const task of tasks) {
      if (task.status === 'pending' || task.status === 'running') {
        this.taskManager.updateStatus(task.id, 'killed');
      }
    }
    return this.teamManager.removeMember(teamName, memberName);
  }

  // ========== Task 操作 ==========

  /**
   * 创建任务
   * @param {Object} config - 任务配置
   */
  createTask(config) {
    return this.taskManager.createTask(config);
  }

  /**
   * 更新任务
   * @param {string} taskId - 任务ID
   * @param {Object} updates - 更新字段
   */
  updateTask(taskId, updates) {
    return this.taskManager.updateTask(taskId, updates);
  }

  /**
   * 更新任务状态
   * @param {string} taskId - 任务ID
   * @param {string} status - 新状态
   * @param {Object} [extra] - 额外数据
   */
  updateTaskStatus(taskId, status, extra) {
    return this.taskManager.updateStatus(taskId, status, extra);
  }

  /**
   * 获取任务
   * @param {string} taskId - 任务ID
   */
  getTask(taskId) {
    return this.taskManager.getTask(taskId);
  }

  /**
   * 列出任务
   * @param {Object} [filter] - 过滤条件
   */
  listTasks(filter) {
    return this.taskManager.listTasks(filter);
  }

  /**
   * 获取任务统计
   * @param {string} [teamName] - 团队名称
   */
  getTaskStats(teamName) {
    return this.taskManager.getStats(teamName);
  }

  /**
   * 删除任务
   * @param {string} taskId - 任务ID
   */
  deleteTask(taskId) {
    return this.taskManager.deleteTask(taskId);
  }

  // ========== Message 操作 ==========

  /**
   * 发送消息
   * @param {Object} msg - 消息配置
   */
  sendMessage(msg) {
    return this.messageBus.send(msg);
  }

  /**
   * 广播消息
   * @param {string} from - 发送者
   * @param {string} content - 消息内容
   * @param {string} teamName - 团队名称
   */
  broadcastToTeam(from, content, teamName) {
    const team = this.teamManager.getTeam(teamName);
    if (!team) throw new Error(`Team "${teamName}" not found`);
    const members = Array.from(team.members.keys());
    return this.messageBus.broadcast(from, content, members);
  }

  /**
   * 获取代理消息
   * @param {string} agentName - 代理名称
   * @param {boolean} [clear] - 是否清除
   */
  getMessages(agentName, clear) {
    return this.messageBus.getInbox(agentName, clear);
  }

  // ========== 团队启动流程 ==========

  /**
   * 启动团队协作
   * @param {string} teamName - 团队名称
   * @param {Array} tasks - 初始任务列表
   */
  startTeamWorkflow(teamName, tasks = []) {
    const team = this.teamManager.getTeam(teamName);
    if (!team) throw new Error(`Team "${teamName}" not found`);

    // 创建初始任务
    const createdTasks = [];
    for (const taskConfig of tasks) {
      const task = this.taskManager.createTask({
        ...taskConfig,
        teamName
      });
      createdTasks.push(task);
    }

    // 通知所有成员团队启动
    this.broadcastToTeam('coordinator', `Team "${teamName}" workflow started`, teamName);

    return {
      team,
      tasks: createdTasks
    };
  }

  /**
   * 关闭团队
   * @param {string} teamName - 团队名称
   */
  shutdownTeam(teamName) {
    const team = this.teamManager.getTeam(teamName);
    if (!team) throw new Error(`Team "${teamName}" not found`);

    // 取消所有待处理任务
    const tasks = this.taskManager.listTasks({ teamName: teamName });
    for (const task of tasks) {
      if (['pending', 'running'].includes(task.status)) {
        this.taskManager.updateStatus(task.id, 'killed');
      }
    }

    // 发送关闭请求给所有成员
    for (const member of team.members.keys()) {
      this.messageBus.sendShutdownRequest(member, 'coordinator', `Team "${teamName}" is shutting down`);
    }

    return { success: true, teamName };
  }

  /**
   * 获取完整状态
   */
  getStatus() {
    return {
      teams: this.listTeams(),
      taskStats: this.getTaskStats(),
      messageStats: this.messageBus.getStats()
    };
  }

  /**
   * 导出团队数据（序列化）
   */
  export() {
    const teams = [];
    for (const team of this.teamManager.teams.values()) {
      teams.push({
        ...team,
        members: Array.from(team.members.values())
      });
    }
    return {
      teams,
      tasks: Array.from(this.taskManager.tasks.values()),
      exportedAt: Date.now()
    };
  }

  /**
   * 从数据恢复
   * @param {Object} data - 导出的数据
   */
  import(data) {
    // 恢复团队
    if (data.teams) {
      for (const teamData of data.teams) {
        const members = teamData.members.map(m => ({ name: m.name, agentType: m.agentType }));
        this.teamManager.createTeam({
          name: teamData.name,
          description: teamData.description,
          members
        });
      }
    }
  }
}

module.exports = Coordinator;
