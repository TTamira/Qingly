/* ============================================================
 * 青序工作台 · 查找丢失的目标节点
 * 用途：拖拽后节点"消失"时，在控制台打印完整树结构（含归档节点），
 *       并标记可能被折在深层/归档的节点，便于定位和恢复。
 * 使用：Ctrl+Alt+I 打开 DevTools → Console → 粘贴执行
 * ============================================================ */
(function findLostGoal(){
  const all = [];
  const walk = (nodes, path, depth, parentArchived) => {
    (nodes||[]).forEach(n => {
      const chain = path.concat([n.title]);
      const archived = !!(n.archived || parentArchived);
      all.push({
        id: n.id,
        lv: n.lv,
        title: n.title,
        depth,
        archived,
        parentArchived: !!parentArchived,
        path: chain.join(" / "),
        childCount: (n.children||[]).length,
        taskCount: (data.todo||[]).filter(t=>String(t.goalId)===String(n.id)).length,
      });
      walk(n.children, chain, depth+1, archived);
    });
  };
  walk(data.goal||[], [], 0, false);

  console.group("📋 目标树完整节点清单（共 " + all.length + " 个，含归档）");
  all.forEach(n => {
    const flag = n.archived ? " 🔒已归档" : (n.depth>1 ? " 📂深层" : "");
    console.log(
      `[${n.lv.padEnd(9)}] ${flag} depth=${n.depth} 子=${n.childCount} 任务=${n.taskCount}  id=${n.id}\n` +
      `    ${n.path}`
    );
  });
  console.groupEnd();

  // 找出可疑节点：阶段(stage)层级但不在 depth=2，或被归档，或深度异常深
  const suspicious = all.filter(n =>
    n.archived ||
    (n.lv==="stage" && n.depth!==2) ||
    (n.lv==="week" && n.depth!==3) ||
    n.depth>4
  );
  if(suspicious.length){
    console.group("⚠ 可能丢失的节点（层级/深度异常或已归档）：");
    suspicious.forEach(n => {
      console.log(`id=${n.id} [${n.lv}] depth=${n.depth} archived=${n.archived}\n    ${n.path}`);
    });
    console.groupEnd();
  } else {
    console.log("✅ 未发现层级异常或归档节点。如果节点仍然看不到，可能是被折在折叠的父节点下——试试点「全部展开」。");
  }

  // 额外：统计各方向下的节点数，方便对比
  console.group("📊 各方向节点统计");
  (data.goal||[]).forEach(d => {
    let c=0; const w=(ns)=>{(ns||[]).forEach(()=>{c++; w(ns&&ns.children&&[]);});};
    const count=(ns)=>{let n=0;(ns||[]).forEach(x=>{n++; n+=count(x.children);});return n;};
    console.log(`${d.title}: ${count(d.children)} 个子节点 ${d.archived?'🔒':''}`);
  });
  console.groupEnd();

  // 暴露一个恢复函数：把指定 id 的节点移到「职业」方向下第一层（成为总目标）
  window.__recoverGoal = function(id){
    const ix = goalIndex();
    const e = ix[id];
    if(!e){ console.log("找不到 id=" + id); return; }
    const node = e.node;
    // 从原父级摘出
    if(e.parentNode){
      const i = e.parentNode.children.indexOf(node);
      if(i>=0) e.parentNode.children.splice(i,1);
    } else {
      const i = (data.goal||[]).indexOf(node);
      if(i>=0) data.goal.splice(i,1);
    }
    // 取消归档
    delete node.archived; delete node.archivedAt;
    // 挂到「职业」方向下
    const career = (data.goal||[]).find(d => /职业/.test(d.title));
    if(career){
      career.children = career.children||[];
      career.children.push(node);
      // 修正层级
      const relv=(n,d)=>{ n.lv=GOAL_LEVELS[Math.min(d,3)].key; (n.children||[]).forEach(k=>relv(k,d+1)); };
      relv(node, 1);
      // 展开职业及其子节点
      data.__goalOpen = data.__goalOpen||{};
      data.__goalOpen[career.id]=true;
      data.__goalOpen[node.id]=true;
      persist();
      console.log("✅ 已恢复节点「" + node.title + "」到「职业」方向下");
    } else {
      console.log("❌ 找不到「职业」方向");
    }
  };
  console.log("\n💡 如需恢复某个节点，请执行：__recoverGoal(节点id)");
  console.log("   例如：__recoverGoal(" + (all[0]?all[0].id:'?') + ")");
})();
