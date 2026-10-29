/**
 * 青序工作台 · Python 测试训练目标树 一键注入脚本
 *
 * 用法:
 *   1. 打开青序桌面应用
 *   2. F12 打开开发者工具 → Console 标签
 *   3. 整段复制粘贴 → 回车
 *   4. 目标树模块会自动刷新，看到 🐍 Python 测试能力强化训练 方向
 *
 * 安全:
 *   - 先备份：脚本执行前会自动导出一份完整数据到 localStorage
 *   - 不破坏现有方向：只往 data.goal 末尾 push 新节点
 *   - 可重复执行：检测到已有同名方向时跳过
 */
(() => {
  const LS_KEY = "workbench-desktop-v1";
  const BACKUP_KEY = LS_KEY + "-backup-" + new Date().toISOString().slice(0,10);

  // ─── 数据定义 ───
  const DIRECTION = {
    title: "🐍 Python 测试能力强化训练",
    stage: "验收标准：独立完成小型接口自动化测试项目 —— 需求分析 · 测试设计 · 脚本开发 · 运行调试 · 测试隔离 · 项目说明，并能解释关键设计决策",
    week: "阶段 1 · 基础接口测试 → 阶段 2 · pytest 组织维护 → 阶段 3 · 独立项目",
  };

  const PHASES = [
    {
      title: "阶段 1：独立编写基础接口测试脚本",
      deadline: "6–8 周",
      subs: [
        { title: "子目标 1.1：掌握 Python 基础语法与断言 【已学·需巩固】", deadline: "阶段 1", tasks: [
          "理解变量、函数定义、缩进和冒号的作用",
          "掌握比较运算符与逻辑判断",
          "使用 assert 校验数值、字符串和布尔条件",
          "理解真值判断，区分 assert value 与 assert value is True",
          "根据业务要求选择合适的断言表达式",
          "独立完成基础断言练习",
        ]},
        { title: "子目标 1.2：掌握字典、列表与嵌套 JSON 数据处理 【已学·需巩固】", deadline: "阶段 1", tasks: [
          "区分字典与列表的结构和访问方式",
          "根据字段名提取字典数据",
          "访问多层嵌套 JSON 字段",
          "使用 len() 判断列表长度",
          "使用 in 判断列表成员是否存在",
          "理解空列表、空字符串等值的真假判断",
          "根据接口返回的数据结构编写断言",
        ]},
        { title: "子目标 1.3：独立完成 API 请求与响应校验 【已学·需巩固】", deadline: "阶段 1", tasks: [
          "导入 requests 并发送 GET 请求",
          "理解 response 对象与 status_code",
          "使用 response.json() 解析响应",
          "串联请求、响应、数据提取和业务断言",
          "校验 HTTP 状态码与业务返回码",
          "校验关键字段、嵌套字段和列表数据",
          "独立编写一个完整的基础接口测试函数",
        ]},
        { title: "子目标 1.4：从业务需求设计测试点与断言 【待学习】", deadline: "阶段 1", tasks: [
          "从需求描述中提取可验证的业务规则",
          "区分 HTTP 层校验与业务层校验",
          "为正常场景设计测试数据与预期结果",
          "为异常场景设计测试数据与预期结果",
          "识别空值、缺失字段和边界值等测试场景",
          "为每个测试点选择对应断言",
          "检查测试是否存在漏测与无效断言",
        ]},
        { title: "子目标 1.5：定位与修复 Python 测试脚本错误 【持续训练】", deadline: "阶段 1", tasks: [
          "识别语法错误、缩进错误和函数定义错误",
          "识别模块导入错误与变量命名错误",
          "定位字典键不存在和数据路径错误",
          "区分数据类型错误与断言逻辑错误",
          "根据报错信息定位问题发生的位置",
          "修复代码后重新执行并验证结果",
        ]},
        { title: "子目标 1.6：通过基础接口测试独立编写验收 【待验收】", deadline: "阶段 1", tasks: [
          "根据一段接口需求独立提取测试点",
          "不看示例代码，独立写出请求与响应处理",
          "独立编写状态码、业务字段和列表断言",
          "自行定位并修复至少一处脚本问题",
          "说明每条断言验证的业务规则",
          "完成综合练习并通过代码复核",
        ]},
      ],
    },
    {
      title: "阶段 2：使用 pytest 组织、复用和维护测试代码",
      deadline: "阶段 1 通过后",
      subs: [
        { title: "子目标 2.1：掌握 pytest 的执行机制 【待学习】", deadline: "阶段 2", tasks: [
          "理解 pytest 如何发现测试文件与测试函数",
          "掌握测试执行命令及常用运行方式",
          "理解 pytest 与 requests 各自的职责",
          "阅读测试通过、失败与错误的输出信息",
        ]},
        { title: "子目标 2.2：使用参数化提高用例复用率 【待学习】", deadline: "阶段 2", tasks: [
          "理解 pytest.mark.parametrize 的作用",
          "为同一接口设计多组输入和预期结果",
          "区分测试数据、测试步骤和断言",
          "分析参数化测试失败的具体数据组合",
        ]},
        { title: "子目标 2.3：使用 fixture 管理测试前置条件 【待学习】", deadline: "阶段 2", tasks: [
          "理解 fixture 的作用与调用方式",
          "使用 fixture 复用请求或测试数据准备逻辑",
          "掌握 fixture 的 yield 与清理逻辑",
          "理解 fixture 作用域与执行次数",
          "使用 conftest.py 组织公共 fixture",
          "避免测试之间产生不必要的数据依赖",
        ]},
        { title: "子目标 2.4：分析测试失败并维护测试质量 【待学习】", deadline: "阶段 2", tasks: [
          "区分接口自身失败与测试脚本问题",
          "从失败日志定位具体用例和断言",
          "减少重复代码并提取公共逻辑",
          "理解测试隔离、数据清理和重复执行",
          "组织清晰的测试目录与模块",
        ]},
      ],
    },
    {
      title: "阶段 3：独立完成小型接口自动化测试项目",
      deadline: "阶段 2 通过后",
      subs: [
        { title: "子目标 3.1：分析接口需求并设计测试方案 【待学习】", deadline: "阶段 3", tasks: [
          "阅读接口文档并梳理请求与响应结构",
          "识别核心业务规则和异常处理规则",
          "设计正常、异常和边界测试用例",
          "确定每个用例的测试数据与预期结果",
          "评估接口风险并确定测试优先级",
        ]},
        { title: "子目标 3.2：设计自动化项目结构 【待学习】", deadline: "阶段 3", tasks: [
          "划分测试用例、公共方法、配置与测试数据",
          "建立清晰的项目目录结构",
          "管理接口地址和环境配置",
          "抽取公共请求逻辑并控制重复代码",
          "明确测试数据的创建、使用与清理方式",
        ]},
        { title: "子目标 3.3：实现并调试自动化测试项目 【待学习】", deadline: "阶段 3", tasks: [
          "实现核心接口的自动化测试用例",
          "通过 pytest 运行整组测试",
          "处理脚本异常、接口异常与断言失败",
          "检查用例覆盖率和重复测试问题",
          "验证测试可重复运行且相互独立",
        ]},
        { title: "子目标 3.4：完成项目验收与复盘 【待学习】", deadline: "阶段 3", tasks: [
          "整理项目说明与运行步骤",
          "记录测试范围、覆盖场景和已知限制",
          "检查代码可读性与公共逻辑设计",
          "复盘测试遗漏、调试过程与改进方向",
          "形成可演示、可复现的项目成果",
        ]},
      ],
    },
  ];

  // ─── 生成节点 ───
  let idBase = Date.now() * 10;
  const newId = () => ++idBase;

  function buildTree() {
    const phases = PHASES.map(phase => ({
      id: newId(), lv: "goal", title: phase.title, deadline: phase.deadline,
      children: phase.subs.map(sub => ({
        id: newId(), lv: "stage", title: sub.title, deadline: sub.deadline,
        children: sub.tasks.map(task => ({
          id: newId(), lv: "week", title: task, children: []
        }))
      }))
    }));
    return {
      id: newId(), lv: "direction",
      title: DIRECTION.title, stage: DIRECTION.stage, week: DIRECTION.week,
      children: phases,
    };
  }

  function count(node) {
    return 1 + (node.children || []).reduce((s, c) => s + count(c), 0);
  }

  // ─── 主逻辑 ───
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) { console.error("找不到青序数据，请确认在青序应用里运行"); return; }

  let data;
  try { data = JSON.parse(raw); } catch(e) { console.error("数据解析失败:", e); return; }

  const goal = data.goal || [];

  // 幂等：检测是否已有同名方向
  const exists = goal.some(g => g.title && g.title.includes("🐍 Python"));
  if (exists) {
    console.warn("⚠️ 目标树里已有同名方向，跳过注入。如需重建请先删除旧的。");
    return;
  }

  // 备份
  localStorage.setItem(BACKUP_KEY, raw);
  console.log(`📦 已备份到 localStorage key: ${BACKUP_KEY}`);

  // 注入
  const dir = buildTree();
  goal.push(dir);
  data.goal = goal;
  localStorage.setItem(LS_KEY, JSON.stringify(data));

  console.log(`✅ 注入成功！新增方向节点: ${count(dir)} 个`);
  console.log(`   direction=1  goal=3  stage=14  week=78`);
  console.log(`🔄 刷新页面（或重新打开目标树模块）即可看到`);
  console.log(`🗑️ 如需撤销，在 Console 执行: localStorage.setItem("${LS_KEY}", localStorage.getItem("${BACKUP_KEY}")); location.reload();`);
})();
