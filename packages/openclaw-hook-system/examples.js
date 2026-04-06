/**
 * OpenClaw Hook System - Usage Examples
 */

const hookSystem = require('./hook-system.js');

async function examples() {
  console.log('=== OpenClaw Hook System Examples ===\n');

  // ==========================================================================
  // 1. Basic Registration
  // ==========================================================================
  console.log('1. Registering hooks...');
  
  hookSystem.registerHook('PreToolUse', {
    name: 'my-logger',
    source: 'userSettings',
    enabled: true,
    commands: [
      {
        type: 'command',
        command: 'echo "Tool: {{tool.name}}"',
        if: "tool.name == 'exec'"
      }
    ]
  });

  // ==========================================================================
  // 2. Getting Hooks for Event
  // ==========================================================================
  console.log('2. Getting hooks for PreToolUse...');
  
  const hooks = hookSystem.getHooksForEvent('PreToolUse');
  console.log(`Found ${hooks.length} hooks:`);
  hooks.forEach(h => console.log(`  - ${h.name} (${h.source})`));

  // ==========================================================================
  // 3. Condition Matching
  // ==========================================================================
  console.log('\n3. Testing condition matching...');
  
  const testCases = [
    { condition: "tool.name == 'exec'", context: { tool: { name: 'exec' } }, expected: true },
    { condition: "tool.name == 'read'", context: { tool: { name: 'exec' } }, expected: false },
    { condition: "session.duration > 60", context: { session: { duration: 120 } }, expected: true },
    { condition: "tool.args[0] && tool.args[0].includes('rm')", context: { tool: { args: ['rm -rf /'] } }, expected: true },
    { condition: "tool.name.startsWith('mcp_')", context: { tool: { name: 'mcp_tools_call' } }, expected: true },
    { condition: "tool.name.startsWith('mcp_')", context: { tool: { name: 'exec' } }, expected: false },
  ];

  for (const { condition, context, expected } of testCases) {
    const result = hookSystem.matchCondition(condition, context);
    const status = result === expected ? '✅' : '❌';
    console.log(`  ${status} "${condition}" => ${result} (expected: ${expected})`);
  }

  // ==========================================================================
  // 4. Executing Hooks
  // ==========================================================================
  console.log('\n4. Executing hooks...');
  
  const context = {
    tool: { name: 'exec', args: ['ls -la'] },
    session: { id: 'test-session-123', duration: 45 },
    event: { type: 'PreToolUse' }
  };

  const results = await hookSystem.triggerHooks('PreToolUse', context);
  console.log(`Executed ${results.length} hook command(s)`);
  results.forEach((r, i) => {
    console.log(`  Result ${i + 1}: ${r.success ? '✅' : '❌'} ${r.output || r.error || ''}`);
  });

  // ==========================================================================
  // 5. Loading from Config
  // ==========================================================================
  console.log('\n5. Loading from config file...');
  
  // 创建临时配置文件
  const fs = require('fs');
  const yaml = require('js-yaml');
  const path = require('path');
  
  const tempConfig = {
    version: '1.0',
    hooks: {
      PreToolUse: [
        {
          name: 'config-loaded-hook',
          source: 'localSettings',
          enabled: true,
          commands: [
            { type: 'command', command: 'echo "Loaded from config!"' }
          ]
        }
      ]
    }
  };
  
  const configPath = path.join(process.env.HOME || '/tmp', '.openclaw', 'test-hooks.yaml');
  const configDir = path.dirname(configPath);
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  fs.writeFileSync(configPath, yaml.dump(tempConfig), 'utf8');
  
  const store = hookSystem.loadHookConfig(configPath);
  const loadedHooks = hookSystem.getHooksForEvent('PreToolUse', store);
  console.log(`Loaded ${loadedHooks.length} hooks from config`);
  loadedHooks.forEach(h => console.log(`  - ${h.name}`));

  // ==========================================================================
  // 6. Template Interpolation
  // ==========================================================================
  console.log('\n6. Template interpolation...');
  
  const template = 'Session {{session.id}} - Tool {{tool.name}} with args {{tool.args}}';
  const interpolated = hookSystem.interpolate(template, context);
  console.log(`  Template: ${template}`);
  console.log(`  Result: ${interpolated}`);

  // ==========================================================================
  // 7. HTTP Hook Example
  // ==========================================================================
  console.log('\n7. HTTP hook (simulated)...');
  
  const httpResult = await hookSystem.executeCommand({
    type: 'http',
    url: 'https://httpbin.org/get'
  }, context);
  console.log(`  HTTP request success: ${httpResult.success}`);
  if (httpResult.output) {
    console.log(`  Output (truncated): ${httpResult.output.substring(0, 100)}...`);
  }

  // ==========================================================================
  // 8. Hook Emitter (Event Listener Pattern)
  // ==========================================================================
  console.log('\n8. Hook Emitter (event listeners)...');
  
  const emitter = new hookSystem.HookEmitter();
  
  emitter.on('PreToolUse', async (ctx) => {
    console.log(`  Listener received: Tool ${ctx.tool?.name}`);
    return { success: true, output: 'Listener executed' };
  });
  
  await emitter.emit('PreToolUse', { tool: { name: 'test-tool' } });

  // ==========================================================================
  // Cleanup
  // ==========================================================================
  fs.unlinkSync(configPath);
  console.log('\n✅ All examples completed!');
}

examples().catch(console.error);
