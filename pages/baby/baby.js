Page({
  data: {
    hasBaby: true,
    textColor: '#ffffff'
  },

  onLoad() {},

  onShow() {
    // 从添加宝宝页面返回时，可以在这里刷新数据
    // 实际项目中可能需要从缓存或服务器获取最新状态
  },

  onAddBaby() {
    wx.navigateTo({
      url: '/pages/babyAdd/babyAdd'
    })
  },

  onEdit() {
    wx.navigateTo({
      url: '/pages/babyAdd/babyAdd?mode=edit'
    })
  },

  // 根据图片右上角颜色自动调整文字颜色
  onImageLoad(e) {
    // 创建canvas上下文用于获取图片像素信息
    const query = wx.createSelectorQuery()
    query.select('#color-detector')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        
        // 创建image对象
        const img = canvas.createImage()
        img.src = '/assets/sample-baby.jpg'
        
        img.onload = () => {
          // 设置canvas尺寸
          canvas.width = 100
          canvas.height = 100
          
          // 绘制图片
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          
          // 获取右上角区域的像素数据（10x10区域）
          const imageData = ctx.getImageData(90, 0, 10, 10)
          const data = imageData.data
          
          // 计算平均颜色
          let r = 0, g = 0, b = 0
          for (let i = 0; i < data.length; i += 4) {
            r += data[i]
            g += data[i + 1]
            b += data[i + 2]
          }
          
          const pixelCount = data.length / 4
          r = Math.round(r / pixelCount)
          g = Math.round(g / pixelCount)
          b = Math.round(b / pixelCount)
          
          // 计算颜色亮度（YIQ公式）
          const brightness = (r * 299 + g * 587 + b * 114) / 1000
          
          // 根据亮度设置文字颜色
          // 如果图片右上角较暗，则文字为白色；如果较亮，则文字为黑色
          this.setData({
            textColor: brightness > 128 ? '#000000' : '#ffffff'
          })
        }
      })
  }
});
