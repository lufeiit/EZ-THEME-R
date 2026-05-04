export const userKnow = () => `<section lang="zh-CN" aria-labelledby="notice-title" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial;line-height:1.6;">
  <h1 id="notice-title" style="font-size:1.25rem;margin:0 0 0.5rem 0;">用户须知</h1>

  <p style="margin:0 0 0.75rem 0;">
    感谢您选择我们的服务 😊 我们始终注重服务质量，致力于为您提供稳定、安全、流畅的体验。为了保障您和平台的权益，请您务必仔细阅读以下说明：
  </p>

  <ul style="margin:0 0 0.75rem 1.25rem;padding:0;">
    <li><strong>合规使用：</strong> 严禁将本服务用于任何违法、违规或侵害他人权益的行为，否则后果由用户自行承担。</li>
    <li><strong>合理使用：</strong> 请避免过度或异常使用，以免影响您或他人的正常体验。</li>
    <li><strong>隐私保护：</strong> 本平台尊重并保护用户隐私，不会主动记录或保存您的使用日志。</li>
    <li><strong>服务更新：</strong> 平台会持续优化和升级，请及时关注 <a href="https://t.me/" target="_blank">最新通知</a> 。</li>
    <li><strong>沟通支持：</strong> 如有疑问或问题，可随时通过工单或网站在线客服联系我们，我们将尽快为您处理。</li>
  </ul>

  <p style="margin:0 0 0.75rem 0;font-size:0.95rem;">
    <em>免责声明：</em> 本平台仅提供中立的数据中转服务，不对用户的具体使用行为承担责任。用户因使用本服务导致的任何直接或间接损失，本平台不承担法律责任。
  </p>

  <p style="margin:0 0 0.75rem 0;font-size:0.95rem;">
    使用本服务即表示您已阅读、理解并同意以上条款。感谢您的理解与支持，祝您使用愉快！
  </p>

  <footer style="margin-top:0.5rem;font-size:0.85rem;color:#555;">
    <p style="margin:0;">© 本平台 保留所有权利</p>
  </footer>
</section>`

export const shopPopup = () => `<p>如您已有订阅且未过期时，购买同等级订阅<strong>会被视为续费，将追加订阅时长</strong></p><p><strong>续费不会重置当月已使用流量</strong>，当月流量用完需购买<strong>重置流量包</strong></p><p>购买不同等级订阅会<strong>覆盖当前订阅</strong>，请谨慎选择</p><p>购买<strong>重置流量包</strong>会清零当月已使用流量，但<strong>不会延长订阅到期日</strong>，当前订阅的到期日(重置日)不会更改，日期临近不建议购买</p><p>常规套餐每月在订单日<strong>自动重置流量</strong>，未用完的流量<strong>不会累积到下个月</strong></p><p>续费、新开通或重置流量后需等待约<strong>5 分钟</strong>才可以链接节点，同时建议<strong>重启设备</strong></p>`

export const buyConfirm = () => `<p><strong>本站是国际收费渠道，实际付款会根据人民币国际实时汇率上下浮动</strong></p><p>在购买任何套餐之前，请确保您熟悉使用电子设备的基础操作（如PC、移动设备等）并且能够看懂本站的使用教程。</p><p>如果您阅读使用教程存在疑问且无法理解相关的说明，建议以您的设备型号和具体故障在百度或者谷歌搜索相关案列，本站只有使用教程中的基础指导！</p><p>在确保节点没有问题的前提下，<strong style='color: red'>本站不会因使用教程的理解问题提供技术支持或退款！！请务必清楚，您所购买的是线路节点费用而非技术服务费。</strong></p>`

export const ticketPopup = () => `<p><strong>为节约沟通成本</strong></p><p>请先收集错误信息、详细描述问题（如操作系统，客户端不同界面的截图，具体故障截图，具体联网方式等等）</p><p>他人无法猜到您大脑内的想法，请把您的想法转换为详细、具体、清晰的文字描述和截图，能尽快定位问题，从而帮助到您自己</p><p><strong>本站有权拒绝处理因用户描述不清导致无法定位问题的工单</strong></p>`

export const getAppLink = (type) => {
  let link = `https://${window.location.hostname}`

  switch (type) {
    case 'android':
      link = '#/docs/160'
      break
    case 'ios':
      link = '#/docs/130'
      break
    case 'windows':
      link = '#/docs/50'
      break
    case 'macos':
      link = '#/docs/230'
      break
    case 'linux':
      link = '#/docs/290'
      break
    case 'openwrt':
      link = '#/docs/350'
      break
    default:
      link = '#/docs/50'
  }
  return link
}

export const getThemeColor = () => {
  const CACHE_KEY = "myThemeColor";
  const cachedColor = localStorage.getItem(CACHE_KEY);
  if (cachedColor) return cachedColor;

  // 精选调色板（去掉 #9e9d24，换成更舒服的绿色）
  const colors = [
    "#355cc2", // 主题蓝
    "#4a90e2",
    "#5c6bc0",
    "#3f51b5",
    "#1976d2",
    "#26a69a",
    "#009688",
    "#43a047",
    "#7cb342",
    "#fbc02d",
    "#fb8c00",
    "#f4511e",
    "#d32f2f",
    "#c2185b",
    "#8e24aa",
    "#6a1b9a",
    "#5e35b1",
    "#3949ab",
    "#1e88e5",
    "#039be5",
    "#00acc1",
    "#00897b",
    "#2e7d32", // 保留深绿
    "#66bb6a", // ✅ 新加：清新的绿色，替换掉原来的土绿
    "#f57f17",
    "#e65100",
    "#b71c1c"
  ];

  // 随机取一个
  const picked = colors[Math.floor(Math.random() * colors.length)];
  localStorage.setItem(CACHE_KEY, picked);
  return picked;
}
