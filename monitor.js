export const monitorApp = {
  // 初始化参数 注册应用
  /**
   * @param {String} [appcode] 系统标志
   * @param {String} [appuri] 系统请求uri 用于monitor告警上报的回调地址
   * @param {Number} [instId] 机构id
   * @param {Number} [userId] 用户id
   */
  init: params => {
    // 获取cookies的方法
    function getCookie (cookieName) {
      const totalCookie = document.cookie;
      const cookieStartAt = totalCookie.indexOf(`${cookieName}=`);
      if (cookieStartAt === -1) {
        return;
      }
      const valueStartAt = totalCookie.indexOf('=', cookieStartAt) + 1;
      let valueEndAt = totalCookie.indexOf(';', cookieStartAt);
      if (valueEndAt === -1) {
        valueEndAt = totalCookie.length;
      }
      // 截取参数值的字符串
      const cookieValue = unescape(totalCookie.substring(valueStartAt, valueEndAt));
      return cookieValue;
    }

    const appCode = params.appcode || document.getElementById('yingmi-monitor').getAttribute('appcode');// 系统标志
    const appUri = params.appuri || document.getElementById('yingmi-monitor').getAttribute('appuri');// 系统请求uri
    const appVersion = '1.0.0';// 系统版本
    const baseUrl = window.location.origin;
    const monitorApi = `${baseUrl}${appUri}`;

    let instId = getCookie(window.btoa('instId')); // 机构id
    if (instId) {
      instId = window.atob(instId) * 1;
    }
    let userId = getCookie(window.btoa('userId')); // 用户id
    if (userId) {
      userId = window.atob(userId) * 1;
    }

    instId = params.instId || instId;
    userId = params.userId || userId;

    // http请求方法
    const http = function (option) {
      const xmlHttp = new XMLHttpRequest();
      xmlHttp.open(option.method, option.url, true);
      xmlHttp.setRequestHeader('Content-Type', 'application/json');
      xmlHttp.setRequestHeader('x-csrf-token', getCookie('csrfToken'));
      xmlHttp.setRequestHeader('Authorization', `Bearer ${getCookie(window.btoa('accessToken').replace(/=/ig, '_'))}`);
      xmlHttp.setRequestHeader('instId', instId);
      xmlHttp.send(option.data);
    };

    const baseData = function () {
      return {
        appCode,
        appVersion,
        customerId: userId,
        instId,
        referer: document.referrer.substring(0, 250),
        url: window.location.href.substring(0, 250),
        userAgent: window.navigator && window.navigator.userAgent.substring(0, 250),
        network: window.navigator && window.navigator.connection.effectiveType,
      };
    };

    // monitor http 请求报错
    const monitorError = function (error) {
      const data = [
        {
          ...baseData(),
          eventType: 'monitorError',
          eventContent: JSON.stringify(error),
        },
      ];
      http({
        method: 'POST',
        url: monitorApi,
        data: JSON.stringify(data),
      });
    };

    // monitor http 请求
    const monitorHttp = function (info) {
      // 过滤报错
      const eventContent = JSON.parse(info.eventContent || '{}');
      if (!eventContent || eventContent === '{}' || eventContent === {} || (eventContent && eventContent.msg === 'ResizeObserver loop limit exceeded')) {
        return;
      }
      const data = [
        {
          ...baseData(),
          ...info,
        },
      ];
      try {
        http({
          method: 'POST',
          url: monitorApi,
          data: JSON.stringify(data),
        });
      } catch (error) {
        monitorError(error);
      }
    };

    // 采集页面错误
    function collectError () {
      // 资源加载错误数据采集
      window.addEventListener('error', e => {
        const target = e.target;
        let eventContent = {};
        if (target !== window) {
          eventContent = {
            eventType: target.localName,
            url: target.src || target.href,
            msg: `${target.src || target.href} is load error`,
            time: new Date().getTime(), // 错误发生的时间
          };
        }
        const info = {
          eventType: 'javascript',
          eventCode: 'listener error',
          eventContent: JSON.stringify(eventContent),
        };
        monitorHttp(info);
      }, true);

      // 监听js错误
      window.onerror = function (msg, url, row, col, error) {
        const eventContent = {
          row: row,
          col: col,
          msg: error && error.stack ? error.stack : msg,
          url: url,
          time: new Date().getTime(), // 错误发生的时间
        };
        const info = {
          eventType: 'javascript',
          eventCode: 'listener window.onerror',
          eventContent: JSON.stringify(eventContent),
        };
        monitorHttp(info);
      };

      // 监听 promise 错误 缺点是获取不到行数数据
      window.addEventListener('unhandledrejection', e => {
        const eventContent = {
          reason: e.reason,
          message: e.reason && e.reason.message,
          stack: e.reason && e.reason.stack,
        };
        const info = {
          eventType: 'unhandledrejection',
          eventCode: e.reason && e.reason.response && e.reason.response.status,
          eventContent: JSON.stringify(eventContent),
          uriPath: e.reason && e.reason.response && e.reason.response.url,
        };
        monitorHttp(info);
      });
    }
    // 启动应用进行监听
    const launch = () => {
      collectError();
      console.log('monitor launched');
    };

    console.log('monitor init ... ', params);

    if (appCode && appUri) {
      return {
        launch,
      };
    }
    return {};
  },
};
