/**
 * MessageBus - 消息总线模块
 * 处理 Agent 间通信，支持多种消息类型
 */

const { EventEmitter } = require('events');

const MESSAGE_TYPE = {
  MESSAGE: 'message',
  SHUTDOWN_REQUEST: 'shutdown_request',
  TASK_UPDATE: 'task_update',
  TASK_ASSIGNMENT: 'task_assignment',
  TASK_COMPLETE: 'task_complete',
  TASK_FAIL: 'task_fail',
  BROADCAST: 'broadcast',
  PING: 'ping',
  PONG: 'pong'
};

class MessageBus extends EventEmitter {
  constructor() {
    super();
    this.inbox = new Map(); // agentName -> messages[]
    this.pendingShutdown = new Set();
  }

  /**
   * 发送消息
   * @param {Object} msg - 消息
   * @param {string} msg.type - 消息类型
   * @param {string} msg.to - 接收者
   * @param {string} [msg.from] - 发送者
   * @param {*} msg.content - 消息内容
   * @param {Object} [msg.payload] - 额外数据
   */
  send({ type, to, from = 'system', content, payload = {} }) {
    if (!to) throw new Error('Message must have a "to" field');

    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      to,
      from,
      content,
      payload,
      timestamp: Date.now()
    };

    // 存储到收件箱
    if (!this.inbox.has(to)) {
      this.inbox.set(to, []);
    }
    this.inbox.get(to).push(message);

    // 触发事件
    this.emit('message:sent', message);
    this.emit(`message:${type}`, message);

    // 直接触发接收者的事件
    this.emit(to, message);
    this.emit('message:to:' + to, message);

    return message;
  }

  /**
   * 广播消息给所有成员
   * @param {string} from - 发送者
   * @param {string} content - 消息内容
   * @param {Array} recipients - 接收者列表
   * @param {Object} [payload] - 额外数据
   */
  broadcast(from, content, recipients, payload = {}) {
    const messages = [];
    for (const to of recipients) {
      if (to !== from) { // 不发给自己
        messages.push(this.send({
          type: MESSAGE_TYPE.BROADCAST,
          to,
          from,
          content,
          payload
        }));
      }
    }
    return messages;
  }

  /**
   * 发送关闭请求
   * @param {string} to - 目标 agent
   * @param {string} from - 发送者
   * @param {string} [reason] - 原因
   */
  sendShutdownRequest(to, from = 'main', reason = '') {
    this.pendingShutdown.add(to);
    return this.send({
      type: MESSAGE_TYPE.SHUTDOWN_REQUEST,
      to,
      from,
      content: reason || 'Shutdown requested',
      payload: { reason }
    });
  }

  /**
   * 发送任务更新
   * @param {string} to - 目标 agent
   * @param {Object} taskInfo - 任务信息 {taskId, status, title}
   * @param {string} [from] - 发送者
   */
  sendTaskUpdate(to, taskInfo, from = 'system') {
    return this.send({
      type: MESSAGE_TYPE.TASK_UPDATE,
      to,
      from,
      content: `Task ${taskInfo.taskId} updated to ${taskInfo.status}`,
      payload: { task: taskInfo }
    });
  }

  /**
   * 发送任务分配
   * @param {string} to - 目标 agent
   * @param {Object} task - 任务对象
   * @param {string} [from] - 发送者
   */
  sendTaskAssignment(to, task, from = 'coordinator') {
    return this.send({
      type: MESSAGE_TYPE.TASK_ASSIGNMENT,
      to,
      from,
      content: `You have been assigned task: ${task.title}`,
      payload: { task }
    });
  }

  /**
   * 获取代理的收件箱
   * @param {string} agentName - 代理名称
   * @param {boolean} [clear=false] - 获取后是否清除
   */
  getInbox(agentName, clear = false) {
    const messages = this.inbox.get(agentName) || [];
    if (clear) {
      this.inbox.set(agentName, []);
    }
    return messages;
  }

  /**
   * 读取并清除单条消息
   * @param {string} agentName - 代理名称
   */
  popMessage(agentName) {
    const messages = this.inbox.get(agentName) || [];
    return messages.shift();
  }

  /**
   * 检查是否有待处理消息
   * @param {string} agentName - 代理名称
   */
  hasMessages(agentName) {
    return (this.inbox.get(agentName) || []).length > 0;
  }

  /**
   * 获取待关闭的代理
   * @param {string} agentName - 代理名称
   */
  isShutdownPending(agentName) {
    return this.pendingShutdown.has(agentName);
  }

  /**
   * 清除关闭标记
   * @param {string} agentName - 代理名称
   */
  clearShutdownPending(agentName) {
    this.pendingShutdown.delete(agentName);
  }

  /**
   * 获取消息历史统计
   */
  getStats() {
    let total = 0;
    for (const messages of this.inbox.values()) {
      total += messages.length;
    }
    return {
      totalMessages: total,
      agentsWithMessages: this.inbox.size,
      pendingShutdowns: this.pendingShutdown.size
    };
  }

  /**
   * 清除所有消息
   */
  clearAll() {
    this.inbox.clear();
    this.emit('cleared');
  }
}

module.exports = MessageBus;
module.exports.MESSAGE_TYPE = MESSAGE_TYPE;
