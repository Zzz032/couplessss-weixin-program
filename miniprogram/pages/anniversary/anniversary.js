Page({
  data: {
    // 纪念日1数据
    startDate1: "2025-04-11",
    anniversary1: {
      day: "00",
      hour: "00",
      min: "00",
      sec: "00"
    },

    // 纪念日2数据
    startDate2: "2025-04-28",
    anniversary2: {
      day: "00",
      hour: "00",
      min: "00",
      sec: "00"
    },

    // 导航栏相关数据
    barTop: 0,
    barHeight: 0,
    placeHolderHeight: 0,

    timers: []
  },

  onLoad: function () {
    // 获取导航栏高度信息
    const barTop = wx.getSystemInfoSync().statusBarHeight;
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    const barHeight = menuButtonInfo.height + (menuButtonInfo.top - barTop) * 2;

    this.setData({
      barHeight,
      barTop,
      placeHolderHeight: barHeight + barTop
    });

    // 启动所有纪念日计时器
    this.startAllCountdowns();
  },

  onUnload: function () {
    // 清除所有计时器
    this.clearAllTimers();
  },

  // 启动所有倒计时
  startAllCountdowns: function () {
    this.startCountdown(this.data.startDate1, "anniversary1");
    this.startCountdown(this.data.startDate2, "anniversary2");
  },

  // 启动单个倒计时
  startCountdown: function (startDate, dataKey) {
    let that = this;
    let timer = setInterval(function () {
      let lefttime = new Date().getTime() - new Date(startDate.replace(/-/g, "/")).getTime();

      let d = Math.floor(lefttime / 1000 / 3600 / 24);
      let h = Math.floor(lefttime / 1000 / 3600 % 24);
      let m = Math.floor(lefttime / 1000 / 60 % 60);
      let s = Math.floor(lefttime / 1000 % 60);

      d = d < 10 ? "0" + d : d;
      h = h < 10 ? "0" + h : h;
      m = m < 10 ? "0" + m : m;
      s = s < 10 ? "0" + s : s;

      let updateData = {};
      updateData[dataKey] = {
        day: d,
        hour: h,
        min: m,
        sec: s
      };

      that.setData(updateData);
    }, 1000);

    this.data.timers.push(timer);
  },

  // 清除所有计时器
  clearAllTimers: function () {
    this.data.timers.forEach(timer => {
      clearInterval(timer);
    });
    this.data.timers = [];
  },

  // 返回上一页
  // 返回上一页
  goBack: function () {
    // 添加console.log确认函数被调用
    console.log('返回按钮被点击');

    // 添加防抖处理，防止快速多次点击
    if (this.data.lastBackTap && Date.now() - this.data.lastBackTap < 1000) {
      return;
    }
    this.setData({
      lastBackTap: Date.now()
    });

    wx.navigateBack({
      delta: 1,
      fail: (res) => {
        console.error('返回失败:', res);
        // 如果返回失败，尝试其他方式
        wx.switchTab({
          url: '/pages/MainPage/index'
        });
      }
    });
  }
});