import fs from "node:fs/promises";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const OUT = "/Users/lx/XE/XE6-15/.ppt-build/output";
const ASSET = "/Users/lx/XE/XE6-15/.ppt-build/assets";
const W = 1280;
const H = 720;
const M = 64;
const C = {
  ink: "#13252A",
  muted: "#607276",
  pale: "#F7FBFA",
  paper: "#FFFFFF",
  cyan: "#2DB7D4",
  blue: "#4D8DEB",
  bluePale: "#EAF5FB",
  orange: "#EF812F",
  orangePale: "#FFF1E7",
  green: "#4BA982",
  greenPale: "#E8F6EE",
  line: "#D5E4E1",
  dark: "#081417",
};
const FONT = "Microsoft YaHei";

async function bytes(name) {
  const b = await fs.readFile(`${ASSET}/${name}`);
  return new Uint8Array(b);
}

function text(slide, value, left, top, width, height, style = {}) {
  const s = slide.shapes.add({
    geometry: "textbox",
    position: { left, top, width, height },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  s.text = value;
  s.text.style = {
    fontFamily: FONT,
    fontSize: 20,
    color: C.ink,
    breakLine: false,
    ...style,
  };
  return s;
}

function box(slide, left, top, width, height, fill, line = C.line, radius = 18) {
  return slide.shapes.add({
    geometry: "roundRect",
    position: { left, top, width, height },
    fill,
    line: { style: "solid", fill: line, width: line === "none" ? 0 : 1 },
    borderRadius: radius,
  });
}

function line(slide, x1, y1, x2, y2, color = C.line, width = 2, dash = "solid") {
  return slide.shapes.add({
    geometry: "line",
    position: { left: x1, top: y1, width: x2 - x1, height: y2 - y1 },
    fill: "none",
    line: { style: dash, fill: color, width },
  });
}

function image(slide, blob, left, top, width, height, alt, fit = "cover", crop) {
  return slide.images.add({
    blob,
    contentType: "image/png",
    alt,
    fit,
    position: { left, top, width, height },
    ...(crop ? { crop } : {}),
  });
}

function chrome(slide, n, section, dark = false) {
  const color = dark ? "#DDEEEE" : C.muted;
  text(slide, section.toUpperCase(), M, 28, 430, 24, { fontSize: 13, bold: true, color, letterSpacing: 1.4 });
  text(slide, String(n).padStart(2, "0"), 1170, 28, 46, 24, { fontSize: 13, bold: true, color, alignment: "right" });
  line(slide, M, 62, W - M, 62, dark ? "#29454A" : C.line, 1);
}

function title(slide, value, subtitle = null, dark = false) {
  text(slide, value, M, 86, 900, 72, { fontSize: 38, bold: true, color: dark ? C.paper : C.ink, breakLine: true });
  if (subtitle) text(slide, subtitle, M, 158, 980, 54, { fontSize: 21, color: dark ? "#CFE2E3" : C.muted, breakLine: true });
}

function notes(slide, body, sources = []) {
  const sourceText = sources.length ? `\n\n[Sources]\n${sources.map((x) => `- ${x}`).join("\n")}` : "";
  slide.speakerNotes.textFrame.setText(`${body}${sourceText}`);
  slide.speakerNotes.setVisible(true);
}

function step(slide, x, y, num, label, color) {
  const circle = slide.shapes.add({ geometry: "ellipse", position: { left: x, top: y, width: 52, height: 52 }, fill: color, line: { style: "solid", fill: color, width: 0 } });
  circle.text = String(num);
  circle.text.style = { fontFamily: FONT, fontSize: 24, bold: true, color: C.paper, alignment: "center", verticalAlignment: "middle" };
  text(slide, label, x - 18, y + 65, 90, 48, { fontSize: 16, bold: true, color: C.ink, alignment: "center", breakLine: true });
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const [product, help, bound, querySummary, queryDetail, reminderTest] = await Promise.all([
    bytes("product-sample.png"),
    bytes("wechat-help.png"),
    bytes("wechat-bound.png"),
    bytes("wechat-query-summary.png"),
    bytes("wechat-query-detail.png"),
    bytes("wechat-reminder-test.png"),
  ]);

  const deck = Presentation.create({ slideSize: { width: W, height: H } });

  // 1. Cover
  {
    const s = deck.slides.add();
    s.background.fill = C.dark;
    image(s, product, 620, 0, 660, H, "VoiceLife 牛牛设计方案与 3D 打印样机", "cover", { left: 0.02, top: 0.02, right: 0, bottom: 0.02 });
    box(s, 0, 0, 730, H, C.dark, "none", 0);
    text(s, "最佳产品设计\n团队奖申报", M, 84, 520, 126, { fontSize: 23, bold: true, color: C.cyan, breakLine: true });
    text(s, "VoiceLife 牛牛", M, 246, 560, 78, { fontSize: 54, bold: true, color: C.paper });
    text(s, "让一句话，变成一次准时行动", M, 340, 540, 56, { fontSize: 28, color: "#D6EBEA", breakLine: true });
    line(s, M, 438, 310, 438, C.orange, 4);
    text(s, "语音优先的儿童日程陪伴伙伴", M, 464, 470, 34, { fontSize: 19, color: "#B5CECE" });
    text(s, "设计方案 ｜ 3D 打印样机", M, 634, 430, 28, { fontSize: 14, color: "#89A5A6" });
    notes(s, "开场先让评委看到产品，而不是架构。说明本次申报的核心判断：我们没有做更多功能，而是重新设计了孩子完成日程管理的方式。", ["用户提供的产品设计与 3D 打印样机图片"]);
  }

  // 2. Problem moments
  {
    const s = deck.slides.add();
    s.background.fill = C.pale;
    chrome(s, 2, "产品判断");
    title(s, "孩子最容易忘记的，不是一整天，而是刚想到的那件事", "我们把问题收窄到三个真实发生的时刻");
    const items = [
      ["01", "刚想到", "放学路上想起明天要带水彩，却没有纸笔，也不想打开复杂的日历。", C.blue, C.bluePale],
      ["02", "到时间", "提醒响起时，孩子可能正在洗澡、吃饭或上课间隙，不能立刻操作。", C.orange, C.orangePale],
      ["03", "有变化", "今天的阅读要晚一点，孩子想改这一次，但不希望影响明天和下周。", C.green, C.greenPale],
    ];
    items.forEach((it, i) => {
      const x = M + i * 382;
      box(s, x, 270, 350, 270, it[4], it[3], 20);
      text(s, it[0], x + 28, 300, 70, 42, { fontSize: 28, bold: true, color: it[3] });
      text(s, it[1], x + 28, 354, 260, 44, { fontSize: 27, bold: true, color: C.ink });
      text(s, it[2], x + 28, 420, 286, 92, { fontSize: 18, color: C.muted, breakLine: true });
    });
    text(s, "问题不是“有没有日历”，而是孩子能不能在当下记下来、到点被提醒、变化时改得稳。", M, 606, 1110, 40, { fontSize: 22, bold: true, color: C.ink, alignment: "center" });
    notes(s, "这里不要讲市场规模或抽象的时间管理焦虑，直接讲三个具体时刻。它们来自 Issue #53 的产品 Proposal。", ["https://github.com/1024XEngineer/VoiceLife/issues/53"]);
  }

  // 3. Target user
  {
    const s = deck.slides.add();
    s.background.fill = C.paper;
    chrome(s, 3, "目标用户");
    title(s, "我们服务的是没有个人智能终端的孩子", "孩子是日程的主要操作者，不需要借用手机完成主流程");
    box(s, M, 252, 480, 278, C.dark, "none", 24);
    text(s, "一个小学阶段的孩子", M + 34, 290, 400, 44, { fontSize: 30, bold: true, color: C.paper });
    text(s, "有零散的学习与生活安排\n愿意用自然语言说出自己的计划\n能听懂牛牛的简短确认", M + 34, 370, 385, 120, { fontSize: 21, color: "#CFE3E1", breakLine: true });
    text(s, "不依赖个人手机", M + 34, 492, 380, 34, { fontSize: 20, bold: true, color: C.cyan });
    line(s, 610, 316, 1150, 316, C.line, 2);
    line(s, 610, 420, 1150, 420, C.line, 2);
    line(s, 610, 524, 1150, 524, C.line, 2);
    text(s, "孩子", 636, 280, 90, 34, { fontSize: 18, bold: true, color: C.blue });
    text(s, "说出安排 / 查询 / 处理当前提醒", 770, 280, 360, 34, { fontSize: 20, bold: true, color: C.ink });
    text(s, "牛牛", 636, 384, 90, 34, { fontSize: 18, bold: true, color: C.orange });
    text(s, "即时确认 / 到点语音 / 小屏幕反馈", 770, 384, 360, 34, { fontSize: 20, bold: true, color: C.ink });
    text(s, "微信公众号", 636, 488, 130, 34, { fontSize: 18, bold: true, color: C.green });
    text(s, "回执 / 完整列表 / 有效期内辅助操作", 770, 488, 360, 34, { fontSize: 20, bold: true, color: C.ink });
    notes(s, "强调孩子是主要使用者，IM 关联使用者只是辅助通道。这个定位决定了产品不能把手机界面当作主入口。", ["https://github.com/1024XEngineer/VoiceLife/issues/53"]);
  }

  // 4. Existing ways
  {
    const s = deck.slides.add();
    s.background.fill = C.pale;
    chrome(s, 4, "为什么不是普通日历");
    title(s, "纸条、闹钟和家人提醒，都只解决了一部分问题");
    const rows = [
      ["纸条 / 便签", "能写下安排", "刚想到时不一定在身边，容易漏写或忘记查看"],
      ["普通闹钟", "能在固定时间响起", "不知道提醒的具体内容，也不能处理“稍后提醒”"],
      ["家人转告", "当下有人帮忙记住", "孩子没有形成自己记录和处理安排的习惯"],
      ["手机日历", "功能完整", "需要个人终端和多步操作，不适合孩子随时使用"],
    ];
    text(s, "现有方式", M, 238, 200, 30, { fontSize: 16, bold: true, color: C.muted });
    text(s, "它们缺少的共同一环", 660, 238, 400, 30, { fontSize: 16, bold: true, color: C.orange });
    rows.forEach((r, i) => {
      const y = 278 + i * 82;
      line(s, M, y + 62, W - M, y + 62, C.line, 1);
      text(s, r[0], M, y, 260, 36, { fontSize: 22, bold: true, color: C.ink });
      text(s, r[1], 340, y, 280, 36, { fontSize: 19, color: C.muted });
      text(s, r[2], 660, y, 500, 54, { fontSize: 19, color: C.ink, breakLine: true });
    });
    text(s, "孩子需要的是：当下说出来，之后被提醒，变化时还能自己处理。", M, 620, 1110, 36, { fontSize: 24, bold: true, color: C.ink, alignment: "center" });
    notes(s, "这一页把产品机会从“儿童也需要日历”推进到“普通方式无法覆盖完整行为闭环”。", ["https://github.com/1024XEngineer/VoiceLife/issues/53"]);
  }

  // 5. Product choices
  {
    const s = deck.slides.add();
    s.background.fill = C.paper;
    chrome(s, 5, "产品取舍");
    title(s, "我们选择了语音优先、设备自包含、IM 辅助", "把功能边界收窄，换来一条孩子真正能走完的路径");
    const decisions = [
      ["语音优先", "孩子用一句话创建、查询和处理当前提醒。", C.blue],
      ["设备自包含", "牛牛挂在书包上，不要求孩子拥有个人智能终端。", C.orange],
      ["IM 辅助", "微信公众号保存回执、完整列表和提醒详情。", C.green],
    ];
    decisions.forEach((d, i) => {
      const x = M + i * 382;
      text(s, `0${i + 1}`, x, 252, 80, 48, { fontSize: 32, bold: true, color: d[2] });
      line(s, x, 318, x + 310, 318, d[2], 4);
      text(s, d[0], x, 344, 300, 42, { fontSize: 27, bold: true, color: C.ink });
      text(s, d[1], x, 410, 310, 86, { fontSize: 19, color: C.muted, breakLine: true });
    });
    box(s, M, 560, 1110, 80, C.orangePale, "none", 16);
    text(s, "主动不做：完整日历 GUI、批量操作、复杂黑盒排程、让孩子依赖手机完成主流程。", M + 28, 585, 1055, 34, { fontSize: 19, bold: true, color: C.orange, alignment: "center" });
    notes(s, "这页是最佳产品设计奖最重要的产品取舍证据。重点不是列功能，而是说明主动放弃了什么。", ["https://github.com/1024XEngineer/VoiceLife/issues/53"]);
  }

  // 6. Channel roles
  {
    const s = deck.slides.add();
    s.background.fill = C.pale;
    chrome(s, 6, "体验分工");
    title(s, "语音、小屏幕和微信，各自只负责最适合自己的事");
    const cols = [
      ["牛牛语音", "孩子发起操作\n补齐信息\n处理当前提醒", C.blue, C.bluePale],
      ["牛牛小屏幕", "显示当前确认\n最近提醒\n关键物品与简短状态", C.orange, C.orangePale],
      ["微信公众号", "创建回执\n完整列表与详情\n有效期内辅助操作", C.green, C.greenPale],
    ];
    cols.forEach((d, i) => {
      const x = M + i * 382;
      box(s, x, 250, 350, 270, d[3], d[2], 22);
      text(s, d[0], x + 28, 285, 280, 42, { fontSize: 26, bold: true, color: d[2] });
      line(s, x + 28, 348, x + 318, 348, d[2], 3);
      text(s, d[1], x + 28, 380, 280, 110, { fontSize: 20, color: C.ink, breakLine: true });
    });
    text(s, "IM 是辅助通道，不是孩子完成主流程的前置条件。", M, 600, 1110, 36, { fontSize: 23, bold: true, color: C.ink, alignment: "center" });
    notes(s, "从 Issue #53 提炼三通道分工。特别强调 IM 不阻塞孩子此刻听到提醒。", ["https://github.com/1024XEngineer/VoiceLife/issues/53"]);
  }

  // 7. Core flow
  {
    const s = deck.slides.add();
    s.background.fill = C.paper;
    chrome(s, 7, "核心闭环");
    title(s, "一条日程，如何从“说出来”变成“处理完成”");
    text(s, "孩子只说一件事，牛牛负责把复杂性拆开。", M, 200, 740, 34, { fontSize: 21, color: C.muted });
    const xs = [118, 344, 570, 796, 1022];
    const labels = ["说出来", "记下来", "到时间", "被提醒", "处理掉"];
    const colors = [C.blue, C.blue, C.orange, C.orange, C.green];
    xs.forEach((x, i) => {
      step(s, x, 294, i + 1, labels[i], colors[i]);
      if (i < xs.length - 1) line(s, x + 55, 320, xs[i + 1] - 15, 320, C.line, 3);
    });
    text(s, "明天上午 10 点提醒我带水彩", 360, 458, 560, 48, { fontSize: 29, bold: true, color: C.ink, alignment: "center" });
    text(s, "创建 / 查询 / 修改 / 撤销，都围绕同一条日程事实展开", M, 566, 1110, 36, { fontSize: 20, color: C.muted, alignment: "center" });
    notes(s, "用一条主链路把产品能力收束起来，避免展示成四个互不相关的功能模块。", ["https://github.com/1024XEngineer/VoiceLife/issues/53"]);
  }

  // 8. Reminder dual channel
  {
    const s = deck.slides.add();
    s.background.fill = C.dark;
    chrome(s, 8, "提醒设计", true);
    title(s, "提醒不是一条消息，而是牛牛与孩子的一次即时对话", "设备语音提醒为主，微信公众号同步保留结果与辅助入口", true);
    text(s, "到点触发", M, 246, 160, 34, { fontSize: 18, bold: true, color: C.orange });
    line(s, 224, 265, 1070, 265, "#315054", 3);
    const nodes = [
      [260, "牛牛语音", "提醒你，现在是七点，该阅读了。", C.orange],
      [610, "小屏幕", "时间 / 标题 / 当前状态", C.cyan],
      [960, "微信公众号", "详情 / 回执 / 有效期内操作", C.green],
    ];
    nodes.forEach(([x, h, b, c]) => {
      box(s, x - 95, 330, 260, 140, "#122B30", c, 18);
      text(s, h, x - 68, 354, 205, 32, { fontSize: 23, bold: true, color: c, alignment: "center" });
      text(s, b, x - 67, 402, 204, 44, { fontSize: 17, color: "#D0E4E2", alignment: "center", breakLine: true });
    });
    text(s, "孩子说“知道了” → 关闭当前提醒\n孩子说“十分钟后提醒我” → 只推迟当前实例\n1 分钟无回应 → 自动推迟 10 分钟，最多 3 次", M, 548, 1110, 90, { fontSize: 20, color: "#D1E4E2", alignment: "center", breakLine: true });
    notes(s, "这是对用户反馈的修订：提醒不只是 IM。Issue #53 明确了强提醒、弱提醒、自动推迟和语音即时处理规则。", ["https://github.com/1024XEngineer/VoiceLife/issues/53"]);
  }

  // 9. Video placeholder
  {
    const s = deck.slides.add();
    s.background.fill = C.pale;
    chrome(s, 9, "现场演示");
    title(s, "现场演示：从一句话到一次提醒", "此页保留视频位置，后续替换为真实演示素材");
    box(s, 110, 230, 1060, 370, C.dark, "#29454A", 18);
    const play = s.shapes.add({ geometry: "ellipse", position: { left: 590, top: 350, width: 92, height: 92 }, fill: C.orange, line: { style: "solid", fill: C.orange, width: 0 } });
    play.text = "▶";
    play.text.style = { fontFamily: FONT, fontSize: 34, bold: true, color: C.paper, alignment: "center", verticalAlignment: "middle" };
    text(s, "口述日程  →  牛牛确认  →  到点语音提醒  →  微信回执", 250, 526, 780, 34, { fontSize: 20, bold: true, color: "#D8EEEC", alignment: "center" });
    text(s, "建议视频时长：20–30 秒，完整保留四个阶段", 370, 624, 540, 28, { fontSize: 16, color: C.muted, alignment: "center" });
    notes(s, "该页是后续替换入口。演示视频应优先证明设备端语音提醒，再展示微信公众号辅助回执。", ["用户后续补充的现场演示视频"]);
  }

  // 10. WeChat evidence
  {
    const s = deck.slides.add();
    s.background.fill = C.paper;
    chrome(s, 10, "微信公众号协同");
    title(s, "微信只承担回执、详情和辅助操作", "孩子不需要打开复杂界面，关联使用者仍然可以看见发生了什么");
    box(s, 72, 252, 320, 188, "#F3F4F5", C.line, 16);
    image(s, help, 92, 274, 280, 74, "微信公众号帮助与绑定码提示", "contain");
    image(s, bound, 92, 360, 280, 72, "微信公众号绑定成功回执", "contain");
    text(s, "首次绑定", 112, 454, 230, 32, { fontSize: 18, bold: true, color: C.green, alignment: "center" });
    box(s, 436, 252, 290, 288, "#F3F4F5", C.line, 16);
    image(s, querySummary, 456, 274, 250, 104, "日程查询摘要", "contain");
    image(s, queryDetail, 506, 394, 150, 128, "日程查询详情页", "contain");
    text(s, "查询摘要 → 完整详情", 454, 558, 250, 32, { fontSize: 18, bold: true, color: C.blue, alignment: "center" });
    box(s, 770, 252, 440, 288, "#F3F4F5", C.line, 16);
    image(s, reminderTest, 802, 278, 376, 226, "提醒事件回传微信公众号的测试结果", "contain");
    text(s, "提醒回执（测试环境）", 830, 558, 320, 32, { fontSize: 18, bold: true, color: C.orange, alignment: "center" });
    text(s, "微信公众号是辅助通道，不是设备语音提醒的替代品。", M, 634, 1110, 30, { fontSize: 18, bold: true, color: C.ink, alignment: "center" });
    notes(s, "图二、图三证明绑定；图四、图五证明查询摘要和详情；图六更偏测试证据，需标注测试环境，不要冒充最终用户 UI。", ["用户提供的微信公众号与 H5 截图", "https://github.com/1024XEngineer/VoiceLife/issues/53"]);
  }

  // 11. Architecture
  {
    const s = deck.slides.add();
    s.background.fill = C.pale;
    chrome(s, 11, "架构如何支撑体验");
    title(s, "前台只说一句话，后台把复杂性分开承担");
    text(s, "产品体验的简单，不等于系统实现简单。", M, 202, 560, 32, { fontSize: 21, color: C.muted });
    const blocks = [
      [M, "日程", "记录\n安排了什么", C.blue, C.bluePale],
      [M + 382, "定时任务", "触发\n什么时候发生", C.orange, C.orangePale],
      [M + 764, "通知", "送达\n通过什么通道", C.green, C.greenPale],
    ];
    blocks.forEach((b, i) => {
      box(s, b[0], 292, 310, 178, b[5], b[4], 20);
      text(s, b[1], b[0] + 28, 326, 250, 38, { fontSize: 27, bold: true, color: b[4] });
      text(s, b[2], b[0] + 28, 386, 250, 64, { fontSize: 20, color: C.ink, breakLine: true });
      if (i < blocks.length - 1) {
        line(s, b[0] + 315, 380, blocks[i + 1][0] - 28, 380, C.line, 3);
        text(s, "领域事件", b[0] + 314, 344, 92, 28, { fontSize: 14, color: C.muted, alignment: "center" });
      }
    });
    text(s, "本地日程是业务事实源，微信公众号只接收语义化回执和有效期内动作。", M, 554, 1110, 38, { fontSize: 20, bold: true, color: C.ink, alignment: "center" });
    text(s, "语音 → 意图 → 日程 → 定时触发 → 提醒事件 → 牛牛语音 + 微信回执", M, 620, 1110, 30, { fontSize: 17, color: C.muted, alignment: "center" });
    notes(s, "只讲能解释产品体验的架构，不展示完整数据库或平台适配细节。Issue #65 明确本地事实源和三类模块边界。", ["https://github.com/1024XEngineer/VoiceLife/issues/65", "https://github.com/1024XEngineer/VoiceLife/blob/main/docs/architecture/design-guidelines.md"]);
  }

  // 12. Physical validation
  {
    const s = deck.slides.add();
    s.background.fill = C.paper;
    chrome(s, 12, "从设计到实物");
    title(s, "从设计稿到开发板，再到可携带样机");
    image(s, product, 64, 240, 540, 270, "设计方案与 3D 打印样机", "cover", { left: 0.02, top: 0.04, right: 0.02, bottom: 0.04 });
    text(s, "设计形态", 180, 532, 300, 30, { fontSize: 18, bold: true, color: C.blue, alignment: "center" });
    const metrics = [
      ["ESP32-S3", "完成设备侧链路验证", C.blue],
      ["语音链路", "多轮会话、音频与显示回归", C.orange],
      ["存储链路", "SQLite / FATFS / 复位恢复验证", C.green],
    ];
    metrics.forEach((m, i) => {
      const y = 250 + i * 112;
      line(s, 684, y + 42, 720, y + 42, m[2], 4);
      text(s, m[0], 750, y, 200, 32, { fontSize: 22, bold: true, color: m[2] });
      text(s, m[1], 750, y + 38, 400, 38, { fontSize: 18, color: C.muted });
    });
    box(s, 684, 590, 500, 58, C.greenPale, "none", 14);
    text(s, "产品不再停留在概念图，而是已经有可运行的实体样机。", 708, 608, 450, 26, { fontSize: 16, bold: true, color: C.green, alignment: "center" });
    notes(s, "用图一证明从外形设计到 3D 打印样机，用仓库工程证据证明设备侧链路和存储链路已经有验证。不要把概念渲染图写成量产产品。", ["用户提供的产品设计与 3D 打印样机图片", "https://github.com/1024XEngineer/VoiceLife/blob/main/docs/engineering/bailian-sparkbot-voice-validation.md", "https://github.com/1024XEngineer/VoiceLife/blob/main/docs/engineering/board-storage-validation.md"]);
  }

  // 13. X Engineer method
  {
    const s = deck.slides.add();
    s.background.fill = C.pale;
    chrome(s, 13, "团队方法");
    title(s, "我们把每个产品判断，都变成可追踪的工程交付");
    const xs = [126, 362, 598, 834, 1070];
    const labels = ["Proposal", "架构", "Issue / PR", "测试", "实板验证"];
    const subs = ["先回答为谁做", "先定边界", "再进入实现", "结果可复现", "从代码走到实物"];
    xs.forEach((x, i) => {
      const c = [C.blue, C.cyan, C.orange, C.green, C.ink][i];
      step(s, x, 296, i + 1, labels[i], c);
      text(s, subs[i], x - 42, 428, 136, 48, { fontSize: 16, color: C.muted, alignment: "center", breakLine: true });
      if (i < xs.length - 1) line(s, x + 56, 322, xs[i + 1] - 14, 322, C.line, 3);
    });
    box(s, 160, 560, 960, 70, C.dark, "none", 18);
    text(s, "不是先堆功能，再回头解释；而是先做取舍，再用代码、测试和实板证据把取舍落地。", 190, 580, 900, 30, { fontSize: 19, bold: true, color: C.paper, alignment: "center" });
    notes(s, "这一页连接训练营规范与项目实践，证明团队不仅做出了产品，还采用了可审查、可回溯的工程方法。", ["https://github.com/1024XEngineer/VoiceLife/issues/53", "https://github.com/1024XEngineer/VoiceLife/issues/65", "https://github.com/1024XEngineer/VoiceLife/blob/main/docs/engineering/collaboration.md"]);
  }

  // 14. Boundaries
  {
    const s = deck.slides.add();
    s.background.fill = C.paper;
    chrome(s, 14, "当前边界");
    title(s, "我们完成了什么，也清楚还没有证明什么");
    box(s, M, 250, 520, 286, C.greenPale, "none", 20);
    text(s, "已完成", M + 32, 284, 180, 36, { fontSize: 26, bold: true, color: C.green });
    text(s, "实体样机与设备侧链路\n语音优先的日程闭环\n微信公众号绑定、查询与回执\n模块边界、测试与实板验证", M + 32, 350, 440, 150, { fontSize: 20, color: C.ink, breakLine: true });
    box(s, 696, 250, 520, 286, C.orangePale, "none", 20);
    text(s, "下一步", 728, 284, 180, 36, { fontSize: 26, bold: true, color: C.orange });
    text(s, "真实儿童试用与长期反馈\n续航、耐用性与复杂环境声学\n更完整的产品外壳与交互打磨\n不把目标提前说成结果", 728, 350, 440, 150, { fontSize: 20, color: C.ink, breakLine: true });
    text(s, "“帮助孩子建立时间观念”是我们的产品目标，接下来要用真实使用验证它。", M, 606, 1110, 42, { fontSize: 20, bold: true, color: C.ink, alignment: "center" });
    notes(s, "最佳产品设计奖不需要把产品包装成已完成的量产产品。主动说清验证边界，反而更符合 X Engineer 的证据标准。", ["https://github.com/1024XEngineer/VoiceLife/issues/53", "https://github.com/1024XEngineer/VoiceLife/blob/main/README.md"]);
  }

  // 15. Close
  {
    const s = deck.slides.add();
    s.background.fill = C.dark;
    image(s, product, 730, 0, 550, H, "VoiceLife 牛牛样机", "cover", { left: 0.1, top: 0.02, right: 0, bottom: 0.02 });
    box(s, 0, 0, 800, H, C.dark, "none", 0);
    chrome(s, 15, "结语", true);
    text(s, "让孩子少记一些，\n少操作一些。", M, 180, 600, 122, { fontSize: 45, bold: true, color: C.paper, breakLine: true });
    text(s, "把日常事务交给牛牛处理，\n用陪伴的方式，帮助孩子逐步建立时间观念。", M, 350, 540, 74, { fontSize: 23, color: "#D2E7E4", breakLine: true });
    line(s, M, 486, 340, 486, C.orange, 4);
    text(s, "VoiceLife 牛牛", M, 520, 360, 34, { fontSize: 20, bold: true, color: C.cyan });
    notes(s, "结尾回到产品愿景，不再增加技术细节。", ["https://github.com/1024XEngineer/VoiceLife/issues/53"]);
  }

  for (const [index, slide] of deck.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    const png = await deck.export({ slide, format: "png", scale: 1 });
    await fs.writeFile(`${OUT}/${stem}.png`, new Uint8Array(await png.arrayBuffer()));
    const layout = await slide.export({ format: "layout" });
    await fs.writeFile(`${OUT}/${stem}.layout.json`, await layout.text());
  }
  const montage = await deck.export({ format: "webp", montage: true, scale: 1 });
  await fs.writeFile(`${OUT}/deck-montage.webp`, new Uint8Array(await montage.arrayBuffer()));
  const pptx = await PresentationFile.exportPptx(deck);
  await pptx.save(`${OUT}/VoiceLife-最佳产品设计团队奖-第一版.pptx`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
