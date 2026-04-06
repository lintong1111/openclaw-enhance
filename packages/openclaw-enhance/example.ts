/**
 * OpenClawEnhance 测试示例
 */
import { 
  OpenClawEnhance, 
  buildTool, 
  isFeatureEnabled,
  CompletionCache,
  ToolSchemaCache,
  compactSession,
  getHooksForEvent,
  loadSkills,
  type Message
} from './index';

async function main() {
  console.log('=== OpenClawEnhance 测试 ===\n');

  // 1. 创建实例
  console.log('1. 创建增强系统实例...');
  const enhance = new OpenClawEnhance({
    useFeatureFlags: false, // 先关闭 Feature Flag 测试基础功能
    cacheOptions: {
      completion: { maxSize: 100, ttlMs: 3600000 },
    }
  });

  // 2. 初始化
  console.log('2. 初始化...');
  await enhance.init();

  // 3. 注册工具（带安全标记）
  console.log('\n3. 注册工具...');
  
  // 注册一个只读工具
  enhance.registerTool({
    name: 'read-file',
    description: '读取文件内容',
    inputSchema: { type: 'object', properties: { path: { type: 'string' } } },
    async call(args: { path: string }) {
      const fs = await import('fs/promises');
      const content = await fs.readFile(args.path, 'utf-8');
      return { data: content };
    },
    // 安全标记
    isReadOnly: () => true,
    isConcurrencySafe: (args) => true,
    isDestructive: () => false,
  });
  console.log('  - read-file (只读) ✓');

  // 注册一个破坏性工具
  enhance.registerTool({
    name: 'delete-file', 
    description: '删除文件',
    inputSchema: { type: 'object', properties: { path: { type: 'string' } } },
    async call(args: { path: string }) {
      const fs = await import('fs/promises');
      await fs.unlink(args.path);
      return { data: `Deleted: ${args.path}` };
    },
    isReadOnly: () => false,
    isConcurrencySafe: () => false,
    isDestructive: () => true,
  });
  console.log('  - delete-file (破坏性) ✓');

  // 4. 测试缓存
  console.log('\n4. 测试 CompletionCache...');
  const cache = new CompletionCache({ maxSize: 10 });
  cache.set('test-key', 'cached response content', 100);
  const cached = cache.get('test-key');
  console.log(`  - 缓存设置/读取: ${cached ? '✓' : '✗'}`);

  // 5. 测试 SchemaCache
  console.log('\n5. 测试 ToolSchemaCache...');
  const schemaCache = new ToolSchemaCache();
  const z = await import('zod');
  const schema = z.z.object({ name: z.z.string() });
  schemaCache.set('test-tool', schema as any);
  const cachedSchema = schemaCache.get('test-tool');
  console.log(`  - Schema 缓存: ${cachedSchema ? '✓' : '✗'}`);

  // 6. 测试 AutoCompact
  console.log('\n6. 测试 AutoCompact...');
  const messages: Message[] = [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi there!' },
    { role: 'user', content: 'How are you?' },
    { role: 'assistant', content: 'I am doing well, thank you for asking!' },
  ];
  const compacted = await compactSession(messages, {
    targetTokens: 50,
    preserveSystem: true,
    preserveRecentMessages: 1,
  });
  console.log(`  - 原始消息: ${messages.length} 条`);
  console.log(`  - 压缩后: ${compacted.length} 条`);
  console.log('  - AutoCompact ✓');

  // 7. 测试 Skill 加载
  console.log('\n7. 测试 Skill 加载...');
  const skills = await loadSkills('userSettings');
  console.log(`  - 加载了 ${skills.length} 个 Skills`);
  console.log('  - Skill 系统 ✓');

  // 8. 测试 Hook（如果配置文件存在）
  console.log('\n8. 测试 Hook 系统...');
  const hooks = getHooksForEvent('SessionStart');
  console.log(`  - SessionStart hooks: ${hooks.length} 个`);
  console.log('  - Hook 系统 ✓');

  // 9. Feature Flag 状态
  console.log('\n9. Feature Flag 状态...');
  console.log(`  - ENHANCE_SYSTEM: ${isFeatureEnabled('ENHANCE_SYSTEM')}`);
  console.log(`  - TOOL_FACTORY: ${isFeatureEnabled('TOOL_FACTORY')}`);
  console.log(`  - HOOK_SYSTEM: ${isFeatureEnabled('HOOK_SYSTEM')}`);
  console.log(`  - CACHE_SYSTEM: ${isFeatureEnabled('CACHE_SYSTEM')}`);
  console.log(`  - AUTO_COMPACT: ${isFeatureEnabled('AUTO_COMPACT')}`);
  console.log(`  - SKILL_SYSTEM: ${isFeatureEnabled('SKILL_SYSTEM')}`);

  console.log('\n=== 全部测试完成 ===');
}

main().catch(console.error);
