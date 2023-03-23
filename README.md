# monitor-js
前端监控平台js，监控浏览器，资源加载错误、js报错等

// 初始化监听应用
const { launch } = monitorApp.init({
      appcode: 'appcode',
      appuri: '/xxx/monitor-js/metrics', // 回调接口地址
      instId: 'xxx',
      userId: 'xxx',
    });
// 启动应用进行监听
if (launch) {
      launch();
}


背景：
前端需要对用户操作过程中的异常信息进行监控并进行记录。
针对该背景，可以考虑通过代码埋点的方式，来对用户的行为进行埋点，后期可以根据埋点的数据对新功能使用效果得到反馈，为产品的良好迭代和优化提供一定的数据分析基础。
