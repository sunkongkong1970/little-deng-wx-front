const WeCropper = require('we-cropper')

Page({
  data: {
    croppedImage: '',
    src: ''
  },

  onLoad() {
    this.initCropper()
  },

  initCropper() {
    const { width, height } = this.getCropSize()
    
    this.cropper = new WeCropper({
      id: 'cropper',
      width,
      height,
      scale: 2.5,
      zoom: 8,
      cut: {
        x: 0,
        y: 0,
        width,
        height
      }
    }).on('ready', () => {
      console.log('cropper is ready')
    })
  },

  getCropSize() {
    const systemInfo = wx.getWindowInfo()
    const width = 680 / 750 * systemInfo.windowWidth
    const height = 380 / 750 * systemInfo.windowWidth
    return { width, height }
  },

  // 添加触摸事件处理
  touchStart(e) {
    this.cropper.touchStart(e)
  },

  touchMove(e) {
    this.cropper.touchMove(e)
  },

  touchEnd(e) {
    this.cropper.touchEnd(e)
  },

  uploadImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      success: (res) => {
        this.setData({ src: res.tempFilePaths[0] })
        this.cropper.pushOrign(res.tempFilePaths[0])
      }
    })
  },

  getCroppedImage() {
    this.cropper.getCropperImage((src) => {
      if (src) {
        this.setData({ croppedImage: src })
      }
    })
  }
})
