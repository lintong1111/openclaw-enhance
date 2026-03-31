/**
 * TeamManager - 团队管理模块
 * 管理团队的创建、删除、成员添加/移除
 */

const { EventEmitter } = require('events');

class TeamManager extends EventEmitter {
  constructor() {
    super();
    this.teams = new Map();
  }

  /**
   * 创建团队
   * @param {Object} config - 团队配置
   * @param {string} config.name - 团队名称
   * @param {string} config.description - 团队描述
   * @param {Array} config.members - 成员列表 [{name, agentType}]
   * @returns {Object} 创建的团队
   */
  createTeam({ name, description = '', members = [] }) {
    if (this.teams.has(name)) {
      throw new Error(`Team "${name}" already exists`);
    }

    const team = {
      id: `team-${Date.now()}`,
      name,
      description,
      members: new Map(),
      createdAt: Date.now(),
      status: 'active'
    };

    // 添加成员
    for (const member of members) {
      team.members.set(member.name, {
        name: member.name,
        agentType: member.agentType || 'general-purpose',
        status: 'idle',
        taskId: null,
        joinedAt: Date.now()
      });
    }

    this.teams.set(name, team);
    this.emit('team:created', team);
    return team;
  }

  /**
   * 删除团队
   * @param {string} name - 团队名称
   */
  deleteTeam(name) {
    const team = this.teams.get(name);
    if (!team) {
      throw new Error(`Team "${name}" not found`);
    }
    this.teams.delete(name);
    this.emit('team:deleted', { name });
  }

  /**
   * 获取团队
   * @param {string} name - 团队名称
   */
  getTeam(name) {
    return this.teams.get(name);
  }

  /**
   * 列出所有团队
   */
  listTeams() {
    return Array.from(this.teams.values()).map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      memberCount: t.members.size,
      status: t.status,
      createdAt: t.createdAt
    }));
  }

  /**
   * 添加成员到团队
   * @param {string} teamName - 团队名称
   * @param {Object} member - 成员 {name, agentType}
   */
  addMember(teamName, { name, agentType = 'general-purpose' }) {
    const team = this.teams.get(teamName);
    if (!team) throw new Error(`Team "${teamName}" not found`);
    if (team.members.has(name)) {
      throw new Error(`Member "${name}" already exists in team`);
    }
    team.members.set(name, {
      name,
      agentType,
      status: 'idle',
      taskId: null,
      joinedAt: Date.now()
    });
    this.emit('member:added', { team: teamName, member: name });
  }

  /**
   * 从团队移除成员
   * @param {string} teamName - 团队名称
   * @param {string} memberName - 成员名称
   */
  removeMember(teamName, memberName) {
    const team = this.teams.get(teamName);
    if (!team) throw new Error(`Team "${teamName}" not found`);
    if (!team.members.has(memberName)) {
      throw new Error(`Member "${memberName}" not found in team`);
    }
    team.members.delete(memberName);
    this.emit('member:removed', { team: teamName, member: memberName });
  }

  /**
   * 更新成员状态
   * @param {string} teamName - 团队名称
   * @param {string} memberName - 成员名称
   * @param {Object} updates - 更新字段 {status, taskId}
   */
  updateMemberStatus(teamName, memberName, updates) {
    const team = this.teams.get(teamName);
    if (!team) throw new Error(`Team "${teamName}" not found`);
    const member = team.members.get(memberName);
    if (!member) throw new Error(`Member "${memberName}" not found in team`);
    Object.assign(member, updates);
    this.emit('member:updated', { team: teamName, member: memberName, updates });
  }

  /**
   * 获取成员
   * @param {string} teamName - 团队名称
   * @param {string} memberName - 成员名称
   */
  getMember(teamName, memberName) {
    const team = this.teams.get(teamName);
    if (!team) return null;
    return team.members.get(memberName) || null;
  }

  /**
   * 列出团队所有成员
   * @param {string} teamName - 团队名称
   */
  listMembers(teamName) {
    const team = this.teams.get(teamName);
    if (!team) return [];
    return Array.from(team.members.values());
  }
}

module.exports = TeamManager;
