/**
 * Example - 协作系统使用示例
 */

const Coordinator = require('./coordinator');
const coordinator = new Coordinator();

async function main() {
  console.log('=== OpenClaw 多 Agent 协作系统示例 ===\n');

  // 1. 创建团队
  console.log('1. 创建团队...');
  const team = coordinator.createTeam({
    name: 'feature-auth',
    description: '认证功能开发团队',
    members: [
      { name: 'backend-dev', agentType: 'general-purpose' },
      { name: 'frontend-dev', agentType: 'general-purpose' },
      { name: 'reviewer', agentType: 'read-only' }
    ]
  });
  console.log(`   团队已创建: ${team.name} (${team.members.size} 成员)\n`);

  // 2. 创建任务
  console.log('2. 创建任务...');
  const loginApiTask = coordinator.createTask({
    title: '实现登录 API',
    description: '实现用户名密码登录和 JWT token 生成',
    owner: 'backend-dev',
    teamName: 'feature-auth'
  });
  console.log(`   任务创建: ${loginApiTask.id} - ${loginApiTask.title}`);

  const loginUiTask = coordinator.createTask({
    title: '实现登录页面',
    description: '实现登录表单 UI',
    owner: 'frontend-dev',
    teamName: 'feature-auth'
  });
  console.log(`   任务创建: ${loginUiTask.id} - ${loginUiTask.title}`);

  const reviewTask = coordinator.createTask({
    title: '代码审查',
    description: '审查登录功能代码',
    owner: 'reviewer',
    teamName: 'feature-auth'
  });
  console.log(`   任务创建: ${reviewTask.id} - ${reviewTask.title}\n`);

  // 3. 模拟后端完成登录 API
  console.log('3. 模拟 backend-dev 开始实现登录 API...');
  coordinator.updateTaskStatus(loginApiTask.id, 'running');
  console.log('   状态: running');

  // 模拟完成 - 等待一小段时间确保异步完成
  await new Promise(resolve => setTimeout(resolve, 50));
  coordinator.taskManager.completeTask(loginApiTask.id, { endpoint: '/api/login' });
  console.log('   状态: completed ✓');
  console.log('   消息已发送给 main agent\n');

  // 4. 发送消息 (在关闭团队之前)
  console.log('4. frontend-dev 发送消息给 backend-dev...');
  coordinator.sendMessage({
    type: 'message',
    to: 'backend-dev',
    from: 'frontend-dev',
    content: '登录 API 完成了吗？我需要接口文档'
  });

  coordinator.sendMessage({
    type: 'message',
    to: 'frontend-dev',
    from: 'backend-dev',
    content: '完成了！文档: /docs/login.md'
  });
  console.log('   消息发送成功 ✓\n');

  // 5. 获取消息
  console.log('5. 获取 frontend-dev 的收件箱...');
  const messages = coordinator.getMessages('frontend-dev');
  for (const msg of messages) {
    console.log(`   [${msg.from}] → [${msg.to}]: ${msg.content}`);
  }
  console.log('');

  // 6. 任务统计
  console.log('6. 任务统计:');
  const stats = coordinator.getTaskStats('feature-auth');
  console.log(`   总计: ${stats.total}`);
  console.log(`   待处理: ${stats.pending}`);
  console.log(`   进行中: ${stats.running}`);
  console.log(`   已完成: ${stats.completed}`);
  console.log(`   已失败: ${stats.failed}\n`);

  // 7. 列出所有任务
  console.log('7. 所有任务列表:');
  const allTasks = coordinator.listTasks({ teamName: 'feature-auth' });
  for (const task of allTasks) {
    console.log(`   [${task.status}] ${task.id}: ${task.title} (${task.owner || '未分配'})`);
  }
  console.log('');

  // 8. 团队状态
  console.log('8. 团队状态:');
  const status = coordinator.getStatus();
  console.log(`   团队数量: ${status.teams.length}`);
  console.log(`   消息统计: ${status.messageStats.totalMessages} 条消息\n`);

  // 9. 关闭团队
  console.log('9. 关闭团队...');
  coordinator.shutdownTeam('feature-auth');
  console.log('   关闭请求已发送给所有成员 ✓\n');

  console.log('=== 示例完成 ===');
}

main().catch(console.error);
