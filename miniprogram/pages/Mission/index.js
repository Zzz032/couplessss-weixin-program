/* 待办列表首页 */

Page({
  // 存储请求结果
  data: {
    allMissions: [], // 用户的所有待办事项
    incompleteMissions: [], // 未完成待办事项
    finishedMissions: [], // 已完成待办事项
    kirbyOpenId: getApp().globalData.kirbyOpenId,
    deeOpenId: getApp().globalData.deeOpenId,
    userOpenId: null, // 缓存用户OpenID
    slideButtons: [{
      extClass: 'starBtn',
      text: '星标',
      src: '../../images/list/star.png'
    }, {
      type: 'warn',
      text: '删除',
      src: '../../images/list/trash.png'
    }]
  },

  async onLoad() {
    // 预先获取并缓存用户OpenID
    this.data.userOpenId = await getApp().getOpenId();
  },

  async onShow() {
    // 获取所有待办事项
    wx.cloud.callFunction({
      name: 'getAll'
    }).then(res => {
      console.log("!", res.result);
      const allMissions = res.result.reverse();
      // 一次性更新所有数据
      this.setData({
        allMissions,
        incompleteMissions: allMissions.filter(mission => mission.freq === 0),
        finishedMissions: allMissions.filter(mission => mission.freq === 1)
      });
    });
  },

  // 合并后的左划按钮处理函数
  async handleSlideButton(e) {
    const {
      index
    } = e.detail;
    const {
      listType,
      index: missionIndex
    } = e.currentTarget.dataset;
    const missionList = this.data[listType];
    const mission = missionList[missionIndex];

    // 使用缓存的OpenID
    if (mission._openid === this.data.userOpenId) {
      const db = await getApp().database();

      if (index === 0) {
        // 处理星标操作
        await db.collection(getApp().globalData.collectionMissionList).where({
          _id: mission._id
        }).update({
          data: {
            star: !mission.star
          }
        });

        // 更新本地数据
        missionList[missionIndex].star = !mission.star;
        this.setData({
          [listType]: missionList
        });
      } else if (index === 1) {
        // 处理删除操作
        await db.collection(getApp().globalData.collectionMissionList).where({
          _id: mission._id
        }).remove();

        // 更新本地数据
        missionList.splice(missionIndex, 1);

        // 重新计算所有列表
        const allMissions = [...this.data.incompleteMissions, ...this.data.finishedMissions];
        this.setData({
          [listType]: missionList,
          allMissions
        });

        // 如果没有任何任务，清空所有列表
        if (this.data.incompleteMissions.length === 0 && this.data.finishedMissions.length === 0) {
          this.setData({
            allMissions: [],
            incompleteMissions: [],
            finishedMissions: []
          });
        }
      }
    } else {
      wx.showToast({
        title: '只能编辑自己的任务！',
        icon: 'error',
        duration: 2000
      });
    }
  },

  // 点击左侧单选框时，切换待办状态
  // 点击左侧单选框时，跳转到完成证明页面
  finishTodo(e) {
    const missionIndex = e.currentTarget.dataset.index;
    const mission = this.data.incompleteMissions[missionIndex];

    // 检查是否是自己的任务（不能完成自己的任务）
    if (mission._openid === this.data.userOpenId) {
      wx.showToast({
        title: '不能完成自己的任务！',
        icon: 'error',
        duration: 2000
      });
      return;
    }

    // 跳转到完成证明页面
    wx.navigateTo({
      url: `../MissionComplete/index?id=${mission._id}`,
    });
  },

  // 跳转响应函数（修改后支持已完成任务点击）
  toDetailPage(e) {
    const {
      index,
      listType
    } = e.currentTarget.dataset;
    const missionList = listType ? this.data[listType] : this.data.incompleteMissions;
    const mission = missionList[index];

    // 检查是否是自己的任务
    if (mission._openid === this.data.userOpenId) {
      // 如果是自己的任务，直接跳转到详情页
      wx.navigateTo({
        url: `../MissionDetail/index?id=${mission._id}`,
      });
    } else {
      // 如果是别人的未完成任务，跳转到完成证明页
      if (mission.freq === 0) {
        wx.navigateTo({
          url: `../MissionComplete/index?id=${mission._id}`,
        });
      }
      // 如果是别人的已完成任务，跳转到详情页
      else {
        wx.navigateTo({
          url: `../MissionDetail/index?id=${mission._id}`,
        });
      }
    }
  },

  toAddPage() {
    wx.navigateTo({
      url: '../MissionAdd/index',
    });
  }
});