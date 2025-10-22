const app = getApp();
const WeCropper = require('we-cropper');
import api from '../../api.js';
import config from '../../env.js';

Page({
  data: {
    childId: null,
    isEdit: false, // 是否处于编辑模式
    isHouseholder: false, // 是否是户主
    babyInfo: {
      childId: '',
      childName: '',
      childNickname: '',
      childGender: '',
      childBirthday: '',
      childContent: '',
      childZodiac: '', // 星座
      childChineseZodiac: '', // 生肖
      childCoverImg: '', // 原图
      childCoverCroppedImg: '', // 裁剪图
      avatarOriginal: '', // 编辑时的原始图片
      avatarCropped: '', // 编辑时的裁剪图片
      avatarCroppedTmp: ''
    },
    showFullImage: false, // 控制大图展示
    currentFullImage: '', // 当前展示的大图URL
    showDatePicker: false,
    showTimePicker: false,
    datePickerValue: [],
    timePickerValue: [],
    yearOptions: [],
    monthOptions: [],
    dayOptions: [],
    hourOptions: [],
    minuteOptions: [],
    secondOptions: [],
    descriptionLength: 0,
    birthDate: '',
    birthTime: '',
    showCropper: false,
    tempImagePath: ''
  },

  async onLoad(options) {
    const { id } = options;
    if (id) {
      this.setData({ childId: id });
      
      // 获取用户信息判断是否是户主
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        this.setData({ isHouseholder: userInfo.isHouseholder || false });
      }

      // 加载宝宝详情
      await this.loadBabyDetail(id);
    }

    // 生成日期选择器数据
    this.generateDateOptions();
  },

  // 加载宝宝详情
  async loadBabyDetail(id) {
    try {
      wx.showLoading({ title: '加载中...' });
      const babyData = await api.getBaby(id);
      console.log('宝宝详情:', babyData);

      // 解析生日
      let birthDate = '';
      let birthTime = '';
      if (babyData.childBirthday) {
        const datetime = babyData.childBirthday.replace('T', ' ');
        const parts = datetime.split(' ');
        birthDate = parts[0];
        birthTime = parts[1] || '00:00:00';
      }

      this.setData({
        babyInfo: {
          ...this.data.babyInfo,
          id: babyData.id, // 接口返回的是id字段
          childName: babyData.childName || '',
          childNickname: babyData.childNickname || '',
          childGender: babyData.childGender || '',
          childBirthday: babyData.childBirthday || '',
          childContent: babyData.childContent || '',
          childZodiac: babyData.childZodiac || '',
          childChineseZodiac: babyData.childChineseZodiac || '',
          childCoverImg: babyData.childCoverImg || '',
          childCoverCroppedImg: babyData.childCoverCroppedImg || ''
        },
        birthDate,
        birthTime,
        descriptionLength: (babyData.childContent || '').length
      });

      wx.hideLoading();
    } catch (error) {
      console.error('加载宝宝详情失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 点击图片显示大图
  onImageTap() {
    if (this.data.babyInfo.childCoverImg) {
      this.setData({
        showFullImage: true,
        currentFullImage: this.data.babyInfo.childCoverImg
      });
    }
  },

  // 关闭大图展示
  closeFullImage() {
    this.setData({
      showFullImage: false,
      currentFullImage: ''
    });
  },

  // 进入编辑模式
  onEdit() {
    this.setData({ 
      isEdit: true,
      'babyInfo.avatarCropped': this.data.babyInfo.childCoverCroppedImg,
      'babyInfo.avatarOriginal': this.data.babyInfo.childCoverImg
    });
    this.initCropper();
  },

  // 取消编辑
  onCancelEdit() {
    this.setData({ isEdit: false });
    // 重新加载数据
    this.loadBabyDetail(this.data.childId);
  },

  // 获取裁剪尺寸
  getCropSize() {
    const systemInfo = wx.getWindowInfo()
    const width = 700 / 750 * systemInfo.windowWidth
    const height = 400 / 750 * systemInfo.windowWidth
    return {
      width,
      height
    }
  },

  // 初始化裁剪器
  initCropper() {
    const {
      width,
      height
    } = this.getCropSize()
    this.setData({
      'babyInfo.avatarCroppedTmp': "",
    })
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

  // 触摸事件处理
  touchStart(e) {
    if (this.cropper) {
      this.cropper.touchStart(e)
    }
  },

  touchMove(e) {
    if (this.cropper) {
      this.cropper.touchMove(e)
    }
  },

  touchEnd(e) {
    if (this.cropper) {
      this.cropper.touchEnd(e)
    }
  },

  // 获取裁剪后的图片
  getCroppedImage() {
    if (this.cropper) {
      this.cropper.getCropperImage((src) => {
        if (src) {
          this.setData({
            'babyInfo.avatarCropped': src,
            'babyInfo.avatarCroppedTmp': src,
            showCropper: false
          })

          wx.showToast({
            title: '裁剪成功',
            icon: 'success'
          })
        }
      })
    } else {
      wx.showToast({
        title: '裁剪器未初始化',
        icon: 'none'
      })
      this.setData({
        showCropper: false
      })
    }
  },

  // 选择头像并裁剪
  onChooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.initCropper();

        const tempFilePath = res.tempFiles[0].tempFilePath;

        // 保存原始图片路径
        this.setData({
          'babyInfo.avatarOriginal': tempFilePath,
          tempImagePath: tempFilePath,
          showCropper: true
        });
        this.cropper.pushOrign(tempFilePath)

      },
      fail(err) {
        console.error('选择图片失败:', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 取消裁剪
  cancelCrop() {
    this.setData({
      showCropper: false
    });
  },

  // 生成日期选择器数据
  generateDateOptions() {
    const now = new Date();
    const currentYear = now.getFullYear();

    // 生成年份数据 (2000-当前年份)
    const yearOptions = [];
    for (let year = 2000; year <= currentYear; year++) {
      yearOptions.push({
        label: `${year}年`,
        value: year
      });
    }

    // 生成月份数据
    const monthOptions = [];
    for (let month = 1; month <= 12; month++) {
      monthOptions.push({
        label: `${month}月`,
        value: month
      });
    }

    // 生成日期数据 (默认31天，后续会根据年月动态更新)
    const dayOptions = [];
    for (let day = 1; day <= 31; day++) {
      dayOptions.push({
        label: `${day}日`,
        value: day
      });
    }

    // 生成小时数据 (0-23)
    const hourOptions = [];
    for (let hour = 0; hour < 24; hour++) {
      hourOptions.push({
        label: `${String(hour).padStart(2, '0')}时`,
        value: hour
      });
    }

    // 生成分钟数据 (0-59)
    const minuteOptions = [];
    for (let minute = 0; minute < 60; minute++) {
      minuteOptions.push({
        label: `${String(minute).padStart(2, '0')}分`,
        value: minute
      });
    }

    // 生成秒数据 (0-59)
    const secondOptions = [];
    for (let second = 0; second < 60; second++) {
      secondOptions.push({
        label: `${String(second).padStart(2, '0')}秒`,
        value: second
      });
    }

    this.setData({
      yearOptions,
      monthOptions,
      dayOptions,
      hourOptions,
      minuteOptions,
      secondOptions
    });
  },

  onNameInput(e) {
    this.setData({
      'babyInfo.childName': e.detail.value
    });
  },

  onNickNameInput(e) {
    this.setData({
      'babyInfo.childNickname': e.detail.value
    });
  },

  onGenderChange(e) {
    this.setData({
      'babyInfo.childGender': e.detail.value
    });
  },

  // 描述输入处理
  onDescriptionInput(e) {
    const value = e.detail.value || '';
    const length = value.length;
    this.setData({
      'babyInfo.childContent': value,
      descriptionLength: length
    });
  },

  // 描述变化处理
  onDescriptionChange(e) {
    const value = e.detail.value || '';
    const length = value.length;
    this.setData({
      'babyInfo.childContent': value,
      descriptionLength: length
    });
  },

  // 描述失焦处理
  onDescriptionBlur(e) {
    console.log('描述输入完成:', e.detail.value);
  },

  // 显示日期选择器
  showDatePicker() {
    if (!this.data.isEdit) return;
    
    let datePickerValue = [];
    if (this.data.birthDate) {
      const date = new Date(this.data.birthDate);
      datePickerValue = [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
      ];
    } else {
      const now = new Date();
      datePickerValue = [
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate()
      ];
    }

    this.updateDayOptions(datePickerValue[0], datePickerValue[1]);

    this.setData({
      showDatePicker: true,
      datePickerValue: datePickerValue
    });
  },

  // 显示时间选择器
  showTimePicker() {
    if (!this.data.isEdit) return;
    
    let timePickerValue = [];
    if (this.data.birthTime) {
      const timeParts = this.data.birthTime.split(':');
      timePickerValue = [
        parseInt(timeParts[0]),
        parseInt(timeParts[1]),
        parseInt(timeParts[2])
      ];
    } else {
      timePickerValue = [0, 0, 0];
    }

    this.setData({
      showTimePicker: true,
      timePickerValue: timePickerValue
    });
  },

  // 日期选择器值变化
  onDatePickerChange(e) {
    const newValue = e.detail.value;
    const [year, month] = newValue;

    const currentValue = this.data.datePickerValue;
    if (currentValue.length > 0 && (currentValue[0] !== year || currentValue[1] !== month)) {
      this.updateDayOptions(year, month);
    }

    this.setData({
      datePickerValue: newValue
    });
  },

  // 更新日期选项
  updateDayOptions(year, month) {
    const getDaysInMonth = (year, month) => {
      return new Date(year, month, 0).getDate();
    };

    const dayOptions = [];
    const maxDays = getDaysInMonth(year, month);
    for (let day = 1; day <= maxDays; day++) {
      dayOptions.push({
        label: `${day}日`,
        value: day
      });
    }

    this.setData({
      dayOptions
    });
  },

  // 确认选择日期
  onDatePickerConfirm(e) {
    const value = e.detail.value;
    const year = value[0];
    const month = String(value[1]).padStart(2, '0');
    const day = String(value[2]).padStart(2, '0');
    const birthDate = `${year}-${month}-${day}`;

    this.updateBirthday(birthDate, this.data.birthTime);

    this.setData({
      birthDate: birthDate,
      showDatePicker: false
    });
  },

  // 取消选择日期
  onDatePickerCancel() {
    this.setData({
      showDatePicker: false
    });
  },

  // 确认选择时间
  onTimePickerConfirm(e) {
    const value = e.detail.value;
    const hour = String(value[0]).padStart(2, '0');
    const minute = String(value[1]).padStart(2, '0');
    const second = String(value[2]).padStart(2, '0');
    const birthTime = `${hour}:${minute}:${second}`;

    this.updateBirthday(this.data.birthDate, birthTime);

    this.setData({
      birthTime: birthTime,
      showTimePicker: false
    });
  },

  // 取消选择时间
  onTimePickerCancel() {
    this.setData({
      showTimePicker: false
    });
  },

  // 更新完整的生日信息
  updateBirthday(date, time) {
    if (date) {
      const birthday = time ? `${date} ${time}` : date;
      this.setData({
        'babyInfo.childBirthday': birthday
      });
    }
  },

  // 提交更新
  async onSubmit() {
    const {
      childId,
      childName,
      childNickname,
      childGender,
      childContent,
      avatarOriginal,
      avatarCropped
    } = this.data.babyInfo;

    // 表单验证
    if (!childName.trim()) {
      wx.showToast({
        title: '请输入宝宝姓名',
        icon: 'none'
      });
      return;
    }

    if (!childNickname.trim()) {
      wx.showToast({
        title: '请输入宝宝昵称',
        icon: 'none'
      });
      return;
    }

    if (!childGender) {
      wx.showToast({
        title: '请选择性别',
        icon: 'none'
      });
      return;
    }

    if (!this.data.birthDate) {
      wx.showToast({
        title: '请选择出生日期',
        icon: 'none'
      });
      return;
    }

    if (childContent && childContent.length > 300) {
      wx.showToast({
        title: '描述不能超过300字',
        icon: 'none'
      });
      return;
    }

    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    try {
      // 如果选择了新图片，上传图片
      if (avatarOriginal && avatarCropped && avatarOriginal !== this.data.babyInfo.childCoverImg) {
        wx.showLoading({ title: '上传图片中...' });
        
        const uploadResultCropped = await api.uploadImageFile(token, 'BABY', avatarCropped);
        const uploadResultOriginal = await api.uploadImageFile(token, 'BABY', avatarOriginal);
        
        console.log('图片上传成功:', {
          裁剪图: uploadResultCropped,
          原图: uploadResultOriginal
        });
        
        // 更新到 babyInfo 的正确字段
        this.setData({
          'babyInfo.childCoverImg': uploadResultOriginal,
          'babyInfo.childCoverCroppedImg': uploadResultCropped,
          'babyInfo.avatarCropped': uploadResultCropped,
          'babyInfo.avatarOriginal': uploadResultOriginal
        });
        
        wx.hideLoading();
      }
    } catch (error) {
      console.error('上传图片失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '上传图片失败',
        icon: 'none'
      });
      return;
    }

    // 转换日期格式
    const birthTime = this.data.birthTime || '00:00:00';
    const fullBirthday = `${this.data.birthDate}T${birthTime}`;
    
    const babyInfoToSubmit = {
      ...this.data.babyInfo,
      childId: childId, // 添加id字段
      childBirthday: fullBirthday,
      // 确保封面图字段正确传递
      childCoverImg: this.data.babyInfo.childCoverImg,
      childCoverCroppedImg: this.data.babyInfo.childCoverCroppedImg
    };
    
    try {
      wx.showLoading({ title: '保存中...' });
      
      const result = await api.editBaby(token, babyInfoToSubmit);
      
      wx.hideLoading();
      
      if (result) {
        wx.showToast({
          title: '更新成功',
          icon: 'success',
          duration: 1500
        });
        
        // 退出编辑模式并重新加载数据
        this.setData({ isEdit: false });
        await this.loadBabyDetail(this.data.childId);
        
        // 通知其他页面刷新数据
        const pages = getCurrentPages();
        
        // 查找并刷新 baby 页面
        const babyPage = pages.find(page => page.route === 'pages/baby/baby');
        if (babyPage && typeof babyPage.loadBabyList === 'function') {
          console.log('通知 baby 页面刷新数据');
          babyPage.loadBabyList();
        }
        
        // 查找并刷新 moment 页面
        const momentPage = pages.find(page => page.route === 'pages/moment/moment');
        if (momentPage && typeof momentPage.loadBabyImages === 'function') {
          console.log('通知 moment 页面刷新宝宝图片');
          momentPage.loadBabyImages();
        }
      }
    } catch (error) {
      console.error('更新失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: error.message || '更新失败',
        icon: 'none'
      });
    }
  }
});

