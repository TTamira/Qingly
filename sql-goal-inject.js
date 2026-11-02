/* ============================================================
 * 青序工作台 · SQL 学习计划目标树注入脚本
 * 层级：direction(方向) → goal(总目标) → stage(阶段) → week(子目标)
 *       执行任务 = data.todo 中带 goalId 的记录（sched=false，默认不进今日计划）
 * 使用：在青序 DevTools Console（Ctrl+Alt+I）粘贴整段执行
 * 幂等：已存在含「SQL」的方向则跳过
 * ============================================================ */
(function injectSQLGoal(){
  /* ---------- 1. 幂等检查 ---------- */
  const hit = (data.goal||[]).find(g => g.title && /SQL|数据库操作与数据校验/.test(g.title));
  if(hit){ console.log("⚠ 已存在 SQL 方向：" + hit.title + "，跳过注入。如需重建请先手动删除该方向。"); return; }

  /* ---------- 2. ID 生成器 ---------- */
  let _id = Date.now()*10;
  const nid = () => ++_id;

  /* ---------- 3. 计划数据 ----------
   * 每个 task 用 [内容, 是否完成] 表示，完成=true 对应原计划 [x]
   */
  const PLAN = {
    directionTitle: "提升数据库操作与数据校验能力",
    goalTitle:      "能够独立使用 SQL 完成软件测试中的数据库查询、业务数据校验、异常排查，并能结合 Python 实现基础数据库自动化校验。",
    directionStage: "最终验收：独立阅读业务表结构，编写查询与统计语句，完成订单/支付/库存数据校验，排查常见数据异常，并通过 Python+pytest 实现基础数据库自动化测试。",
    directionWeek:  "阶段一 基础查询 → 阶段二 统计与多表 → 阶段三 测试校验 → 阶段四 进阶与自动化",
    stages: [
      { title:"阶段一：基础查询与数据筛选", deadline:"阶段一", subs:[
        { title:"子目标 1.1：掌握基础查询结构", deadline:"阶段一", tasks:[
          ["学习 SELECT 的基础概念与作用",true],
          ["学习 SELECT 指定字段的语法",true],
          ["学习 SELECT * 查询全部字段",false],
          ["学习 FROM 的作用与语法",true],
          ["学习 WHERE 的作用与基本语法",true],
          ["学习 SQL 中字段、表名与字符串值的基本写法",true],
          ["练习 SELECT、FROM、WHERE 组合查询",true],
        ]},
        { title:"子目标 1.2：掌握条件筛选与逻辑运算", deadline:"阶段一", tasks:[
          ["学习比较运算符（=、!=、>、<、>=、<=）",true],
          ["学习 AND 多条件筛选",true],
          ["学习 OR 多条件筛选",true],
          ["学习 IN 多值匹配",true],
          ["练习 AND 与 IN 组合查询",true],
          ["学习 NOT 的作用与使用方式",false],
          ["学习 NOT IN 排除指定值",false],
          ["学习 LIKE 模糊匹配",false],
          ["学习 LIKE 中 % 与 _ 的含义",false],
          ["学习 AND、OR 混合使用与括号优先级",false],
          ["练习多条件组合筛选",false],
          ["完成条件筛选综合练习",false],
        ]},
        { title:"子目标 1.3：掌握排序、限制与去重", deadline:"阶段一", tasks:[
          ["学习 ORDER BY 的作用与基本语法",false],
          ["学习 ASC 升序排序",false],
          ["学习 DESC 降序排序",false],
          ["学习多字段排序",false],
          ["学习 LIMIT 限制查询结果数量",false],
          ["学习 DISTINCT 查询去重",false],
          ["练习筛选、排序、限制和去重的组合查询",false],
        ]},
        { title:"子目标 1.4：掌握 NULL 与常见语法细节", deadline:"阶段一", tasks:[
          ["学习 NULL 的概念及其与空字符串的区别",false],
          ["学习 IS NULL 查询空值",false],
          ["学习 IS NOT NULL 查询非空值",false],
          ["学习 SQL 中 NULL 的比较特点",false],
          ["学习常见 SQL 语法错误与排查方法",false],
          ["完成阶段一综合查询练习",false],
        ]},
      ]},
      { title:"阶段二：数据统计与多表查询", deadline:"阶段一完成后", subs:[
        { title:"子目标 2.1：掌握聚合函数", deadline:"阶段二", tasks:[
          ["学习 COUNT 的作用与基本语法",false],
          ["学习 COUNT(*) 与 COUNT(字段) 的区别",false],
          ["学习 SUM 求和",false],
          ["学习 AVG 平均值",false],
          ["学习 MAX 与 MIN 最大值、最小值",false],
          ["学习聚合函数对 NULL 的处理",false],
          ["练习多个聚合函数组合统计",false],
        ]},
        { title:"子目标 2.2：掌握分组统计", deadline:"阶段二", tasks:[
          ["学习 GROUP BY 的概念与基本语法",false],
          ["学习按单个字段分组统计",false],
          ["学习多个字段组合分组",false],
          ["学习 HAVING 筛选分组结果",false],
          ["理解 WHERE 与 HAVING 的区别",false],
          ["练习订单状态分组统计",false],
          ["完成分组统计综合练习",false],
        ]},
        { title:"子目标 2.3：掌握多表关联查询", deadline:"阶段二", tasks:[
          ["学习主键、外键及表之间的关联关系",false],
          ["学习 INNER JOIN 内连接",false],
          ["学习 LEFT JOIN 左连接",false],
          ["理解 INNER JOIN 与 LEFT JOIN 的结果差异",false],
          ["学习 JOIN 的 ON 关联条件",false],
          ["学习多张数据表关联查询",false],
          ["练习用户表与订单表关联查询",false],
          ["练习订单表与支付表关联查询",false],
          ["完成多表关联综合练习",false],
        ]},
      ]},
      { title:"阶段三：软件测试中的数据库校验", deadline:"阶段二完成后", subs:[
        { title:"子目标 3.1：掌握增删改后的数据验证", deadline:"阶段三", tasks:[
          ["学习 INSERT 新增数据的基本语法",false],
          ["学习 INSERT 指定字段新增数据",false],
          ["学习 UPDATE 修改数据的基本语法",false],
          ["学习 UPDATE 中 WHERE 条件的作用",false],
          ["学习 DELETE 删除数据的基本语法",false],
          ["理解 DELETE 与 TRUNCATE 的区别",false],
          ["练习新增数据后的数据库校验",false],
          ["练习修改数据后的数据库校验",false],
          ["练习删除数据后的数据库校验",false],
        ]},
        { title:"子目标 3.2：掌握业务数据一致性校验", deadline:"阶段三", tasks:[
          ["学习订单创建后的数据校验方法",false],
          ["练习订单状态与业务流程一致性校验",false],
          ["练习订单金额与支付金额一致性校验",false],
          ["练习支付成功、失败、取消场景的数据校验",false],
          ["练习商品库存变化的数据校验",false],
          ["练习多张业务表之间的数据一致性校验",false],
          ["完成订单创建到支付完成的综合数据校验",false],
        ]},
        { title:"子目标 3.3：掌握异常数据排查", deadline:"阶段三", tasks:[
          ["学习查询重复数据的方法",false],
          ["学习查询缺失数据的方法",false],
          ["学习查询 NULL 与异常字段",false],
          ["学习查询不符合业务规则的数据",false],
          ["练习通过 JOIN 定位数据不一致问题",false],
          ["练习根据测试现象编写 SQL 排查问题",false],
          ["完成综合异常数据排查练习",false],
        ]},
      ]},
      { title:"阶段四：进阶查询与自动化结合", deadline:"阶段三完成后", subs:[
        { title:"子目标 4.1：掌握进阶查询", deadline:"阶段四", tasks:[
          ["学习子查询的概念与基本结构",false],
          ["学习 WHERE 中使用子查询",false],
          ["学习 IN 与子查询组合使用",false],
          ["学习 EXISTS 的基本概念与用法",false],
          ["学习 WITH 与 CTE 公共表表达式",false],
          ["学习窗口函数的概念与使用场景",false],
          ["学习 ROW_NUMBER 的基本用法",false],
          ["完成进阶查询综合练习",false],
        ]},
        { title:"子目标 4.2：掌握事务与测试数据管理", deadline:"阶段四", tasks:[
          ["学习事务的基本概念",false],
          ["学习 COMMIT 提交事务",false],
          ["学习 ROLLBACK 回滚事务",false],
          ["理解事务的 ACID 特性",false],
          ["学习测试数据准备与清理方法",false],
          ["练习事务回滚与测试数据恢复",false],
        ]},
        { title:"子目标 4.3：结合 Python 实现数据库自动化校验", deadline:"阶段四", tasks:[
          ["学习 Python 连接数据库的基本方式",false],
          ["学习使用 Python 执行 SQL 查询",false],
          ["学习获取和处理数据库查询结果",false],
          ["学习使用 Python 对查询结果进行断言",false],
          ["学习使用 pytest 编写数据库校验测试",false],
          ["练习接口响应结果与数据库数据一致性校验",false],
          ["完成一个小型数据库自动化校验项目",false],
        ]},
      ]},
    ]
  };

  /* ---------- 4. 构建目标树 ---------- */
  const dirId = nid();
  const goalId = nid();

  const stages = PLAN.stages.map(st => {
    const stageId = nid();
    const weeks = st.subs.map(sub => {
      const weekId = nid();
      return {
        id: weekId,
        lv: "week",
        title: sub.title,
        deadline: sub.deadline,
        children: [],
        _tasks: sub.tasks   // 临时字段，后面转成 todo
      };
    });
    return {
      id: stageId,
      lv: "stage",
      title: st.title,
      deadline: st.deadline,
      children: weeks
    };
  });

  const goalNode = {
    id: goalId,
    lv: "goal",
    title: PLAN.goalTitle,
    deadline: "长期",
    children: stages
  };

  const dirNode = {
    id: dirId,
    lv: "direction",
    title: PLAN.directionTitle,
    stage: PLAN.directionStage,
    week: PLAN.directionWeek,
    children: [goalNode]
  };

  /* ---------- 5. 收集所有 week 节点，生成执行任务 todo ---------- */
  data.todo = data.todo || [];
  let taskCount = 0, doneCount = 0;

  stages.forEach(st => {
    st.children.forEach(week => {
      (week._tasks || []).forEach(([title, done]) => {
        data.todo.unshift({
          id: nid(),
          title: title,
          priority: "P1",
          done: !!done,
          note: "",
          group: "学习",
          goalId: week.id,
          sched: false          // 默认只挂目标树，不进今日计划（与 addTask 行为一致）
        });
        taskCount++;
        if(done) doneCount++;
      });
      delete week._tasks;       // 清理临时字段
    });
  });

  /* ---------- 6. 挂入目标树并持久化 ---------- */
  data.goal = data.goal || [];
  data.goal.push(dirNode);

  persist();   // store.save() + render()

  /* ---------- 7. 输出注入报告 ---------- */
  const weekCount = stages.reduce((s,st)=>s+st.children.length,0);
  console.log(`✅ SQL 学习计划注入完成`);
  console.log(`   方向 1 个 · 总目标 1 个 · 阶段 ${stages.length} 个 · 子目标 ${weekCount} 个 · 执行任务 ${taskCount} 条（已完成 ${doneCount} 条）`);
  console.log(`   方向：${PLAN.directionTitle}`);
  console.log(`   所有任务 sched=false，默认只在目标树可见；需要今日执行时在任务行点「安排到今日计划」。`);
})();
