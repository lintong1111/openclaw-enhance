/**
 * Team Tools - Agent 协作工具集
 * 提供给 OpenClaw Agent 使用的工具函数
 */

const Coordinator = require('./coordinator');

// 全局协调器实例
let globalCoordinator = null;

/**
 * 获取协调器实例（单例）
 */
function getCoordinator() {
  if (!globalCoordinator) {
    globalCoordinator = new Coordinator();
  }
  return globalCoordinator;
}

// ========== 工具函数 ==========

/**
 * 创建团队
 */
async function teamCreate({ name, description = '', members = [] }) {
  try {
    const coordinator = getCoordinator();
    const team = coordinator.createTeam({ name, description, members });
    return {
      success: true,
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        memberCount: team.members.size
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 删除团队
 */
async function teamDelete({ name }) {
  try {
    const coordinator = getCoordinator();
    coordinator.deleteTeam(name);
    return { success: true, message: `Team "${name}" deleted` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 列出团队
 */
async function teamList() {
  const coordinator = getCoordinator();
  const teams = coordinator.listTeams();
  return { success: true, teams };
}

/**
 * 获取团队详情
 */
async function teamInfo({ name }) {
  const coordinator = getCoordinator();
  const team = coordinator.getTeam(name);
  if (!team) {
    return { success: false, error: `Team "${name}" not found` };
  }
  return { success: true, team };
}

/**
 * 添加团队成员
 */
async function teamAddMember({ teamName, name, agentType = 'general-purpose' }) {
  try {
    const coordinator = getCoordinator();
    coordinator.addTeamMember(teamName, { name, agentType });
    return { success: true, message: `Member "${name}" added to team "${teamName}"` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 移除团队成员
 */
async function teamRemoveMember({ teamName, name }) {
  try {
    const coordinator = getCoordinator();
    coordinator.removeTeamMember(teamName, name);
    return { success: true, message: `Member "${name}" removed from team "${teamName}"` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 创建任务
 */
async function taskCreate({ title, description = '', owner = null, teamName = null }) {
  try {
    const coordinator = getCoordinator();
    const task = coordinator.createTask({ title, description, owner, teamName });
    return {
      success: true,
      task: {
        id: task.id,
        title: task.title,
        status: task.status,
        owner: task.owner,
        teamName: task.teamName
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 更新任务
 */
async function taskUpdate({ taskId, updates }) {
  try {
    const coordinator = getCoordinator();
    const task = coordinator.updateTask(taskId, updates);
    return { success: true, task };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 更新任务状态
 */
async function taskStatus({ taskId, status, result, error }) {
  try {
    const coordinator = getCoordinator();
    const task = coordinator.taskManager.updateStatus(taskId, status, { result, error });
    return { success: true, task };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 列出任务
 */
async function taskList({ status, owner, teamName } = {}) {
  const coordinator = getCoordinator();
  const filter = {};
  if (status) filter.status = status;
  if (owner) filter.owner = owner;
  if (teamName) filter.teamName = teamName;

  const tasks = coordinator.listTasks(filter);
  return { success: true, tasks };
}

/**
 * 获取任务详情
 */
async function taskInfo({ taskId }) {
  const coordinator = getCoordinator();
  const task = coordinator.getTask(taskId);
  if (!task) {
    return { success: false, error: `Task "${taskId}" not found` };
  }
  return { success: true, task };
}

/**
 * 完成任务
 */
async function taskComplete({ taskId, result }) {
  try {
    const coordinator = getCoordinator();
    const task = coordinator.taskManager.completeTask(taskId, result);
    return { success: true, task };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 标记任务失败
 */
async function taskFail({ taskId, error }) {
  try {
    const coordinator = getCoordinator();
    const task = coordinator.taskManager.failTask(taskId, error);
    return { success: true, task };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 发送消息给 Agent
 */
async function sendMessage({ to, content, from = 'main', type = 'message' }) {
  try {
    const coordinator = getCoordinator();
    const message = coordinator.sendMessage({ type, to, from, content });
    return { success: true, messageId: message.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 广播消息给团队
 */
async function broadcastToTeam({ teamName, content, from = 'main' }) {
  try {
    const coordinator = getCoordinator();
    coordinator.broadcastToTeam(from, content, teamName);
    return { success: true, message: `Broadcast sent to team "${teamName}"` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 获取 Agent 的消息
 */
async function getMessages({ agentName, clear = false }) {
  const coordinator = getCoordinator();
  const messages = coordinator.getMessages(agentName, clear);
  return { success: true, messages, count: messages.length };
}

/**
 * 启动团队工作流
 */
async function startTeamWorkflow({ teamName, tasks }) {
  try {
    const coordinator = getCoordinator();
    const result = coordinator.startTeamWorkflow(teamName, tasks);
    return {
      success: true,
      team: result.team.name,
      taskCount: result.tasks.length
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 关闭团队
 */
async function shutdownTeam({ teamName }) {
  try {
    const coordinator = getCoordinator();
    coordinator.shutdownTeam(teamName);
    return { success: true, message: `Team "${teamName}" shutdown initiated` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 获取协调器状态
 */
async function getStatus() {
  const coordinator = getCoordinator();
  return { success: true, status: coordinator.getStatus() };
}

// ========== 工具导出 ==========

module.exports = {
  // Team 工具
  teamCreate,
  teamDelete,
  teamList,
  teamInfo,
  teamAddMember,
  teamRemoveMember,

  // Task 工具
  taskCreate,
  taskUpdate,
  taskStatus,
  taskList,
  taskInfo,
  taskComplete,
  taskFail,

  // Message 工具
  sendMessage,
  broadcastToTeam,
  getMessages,

  // Workflow 工具
  startTeamWorkflow,
  shutdownTeam,
  getStatus,

  // 获取协调器实例
  getCoordinator
};
