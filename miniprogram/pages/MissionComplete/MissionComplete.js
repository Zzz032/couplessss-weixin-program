Page({
  data: {
    missionId: null,
    mission: null,
    completionText: '',
    images: [],
    isSubmitting: false
  },

  onLoad(options) {
    this.setData({ missionId: options.id });
    this.loadMissionDetails();
  },

  async loadMissionDetails() {
    const db = await getApp().database();
    const res = await db.collection(getApp().globalData.collectionMissionList)
      .doc(this.data.missionId)
      .get();
    
    this.setData({ mission: res.data });
  },

  handleTextChange(e) {
    this.setData({ completionText: e.detail.value });
  },

  chooseImage() {
    wx.chooseImage({
      count: 3,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ 
          images: [...this.data.images, ...res.tempFilePaths].slice(0, 3) 
        });
      }
    });
  },

  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    images.splice(index, 1);
    this.setData({ images });
  },

  async submitCompletion() {
    if (this.data.isSubmitting) return;
    
    if (!this.data.completionText.trim()) {
      wx.showToast({
        title: '请填写完成说明',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '提交中...', mask: true });
    
    try {
      // 1. 上传图片
      const cloudImages = await Promise.all(
        this.data.images.map(async (path) => {
          const ext = path.match(/\.[^.]+?$/)[0];
          const cloudPath = `completion_images/${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
          const uploadRes = await wx.cloud.uploadFile({
            cloudPath,
            filePath: path
          });
          return uploadRes.fileID;
        })
      );
      
      // 2. 更新任务状态
      const db = await getApp().database();
      const _ = db.command;
      
      await db.collection(getApp().globalData.collectionMissionList)
        .doc(this.data.missionId)
        .update({
          data: {
            freq: 1,
            completion: {
              text: this.data.completionText,
              images: cloudImages,
              time: db.serverDate()
            }
          }
        });
      
      // 3. 更新用户积分
      const creditIncrement = this.data.mission.title === '亲亲一次' ? 1 : this.data.mission.award;
      await db.collection(getApp().globalData.collectionUserList)
        .where({ _openid: getApp().globalData.userOpenId })
        .update({
          data: { credit: _.inc(creditIncrement) }
        });
      
      wx.hideLoading();
      wx.showToast({ title: '提交成功', icon: 'success' });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      
    } catch (err) {
      console.error('提交失败:', err);
      wx.hideLoading();
      wx.showToast({ title: '提交失败', icon: 'none' });
      this.setData({ isSubmitting: false });
    }
  }
});