Page({
  data: {
    babyInfo: {
      name: '',
      gender: '',
      birthday: '',
      avatar: '',
      description: ''
    },
    genderOptions: [
      { label: '男宝', value: 'male' },
      { label: '女宝', value: 'female' }
    ],
    currentDate: '',
    showDatePicker: false,
    datePickerValue: [],
    yearOptions: [],
    monthOptions: [],
    dayOptions: [],
    descriptionLength: 0
  },
  
  onLoad() {
    // 初始化当前日期
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`;
    
    // 生成日期选择器数据
    this.generateDateOptions();
    
    this.setData({
      currentDate
    });
  },
  
  // 生成日期选择器数据
  generateDateOptions() {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // 生成年份数据 (1900-当前年份)
    const yearOptions = [];
    for (let year = 2000; year <= currentYear; year++) {
      yearOptions.push({ label: `${year}年`, value: year });
    }
    
    // 生成月份数据
    const monthOptions = [];
    for (let month = 1; month <= 12; month++) {
      monthOptions.push({ label: `${month}月`, value: month });
    }
    
    // 生成日期数据 (默认31天，后续会根据年月动态更新)
    const dayOptions = [];
    for (let day = 1; day <= 31; day++) {
      dayOptions.push({ label: `${day}日`, value: day });
    }
    
    this.setData({
      yearOptions,
      monthOptions,
      dayOptions
    });
  },
  
  onNameInput(e) {
    this.setData({
      'babyInfo.name': e.detail.value
    });
  },
  
  onGenderChange(e) {
    this.setData({
      'babyInfo.gender': e.detail.value
    });
  },
  
  // 描述输入处理
  onDescriptionInput(e) {
    const value = e.detail.value || '';
    const length = value.length;
    this.setData({
      'babyInfo.description': value,
      descriptionLength: length
    });
  },
  
  // 描述变化处理
  onDescriptionChange(e) {
    const value = e.detail.value || '';
    const length = value.length;
    this.setData({
      'babyInfo.description': value,
      descriptionLength: length
    });
  },
  
  // 描述失焦处理
  onDescriptionBlur(e) {
    // 可以在这里添加额外的验证逻辑
    console.log('描述输入完成:', e.detail.value);
  },
  
  // 显示日期选择器
  showDatePicker() {
    // 如果有已选择的日期，设置为默认值
    let datePickerValue = [];
    if (this.data.babyInfo.birthday) {
      const date = new Date(this.data.babyInfo.birthday);
      datePickerValue = [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
      ];
    } else {
      // 默认选择当前日期
      const now = new Date();
      datePickerValue = [
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate()
      ];
    }
    
    // 根据选择的年月更新日期选项
    this.updateDayOptions(datePickerValue[0], datePickerValue[1]);
    
    this.setData({
      showDatePicker: true,
      datePickerValue: datePickerValue
    });
  },
  
  // 日期选择器值变化
  onDatePickerChange(e) {
    const newValue = e.detail.value;
    const [year, month] = newValue;
    
    // 如果年份或月份发生变化，更新日期选项
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
    // 根据月份和年份计算天数
    const getDaysInMonth = (year, month) => {
      return new Date(year, month, 0).getDate();
    };
    
    const dayOptions = [];
    const maxDays = getDaysInMonth(year, month);
    for (let day = 1; day <= maxDays; day++) {
      dayOptions.push({ label: `${day}日`, value: day });
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
    const birthday = `${year}-${month}-${day}`;
    
    this.setData({
      'babyInfo.birthday': birthday,
      showDatePicker: false
    });
  },
  
  // 取消选择日期
  onDatePickerCancel() {
    this.setData({
      showDatePicker: false
    });
  },
  
  onChooseAvatar() {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        // tempFilePath可以作为img标签的src属性显示图片
        const tempFilePath = res.tempFilePaths[0];
        that.setData({
          'babyInfo.avatar': tempFilePath
        });
      }
    });
  },
  
  onSubmit() {
    const { name, gender, birthday, description } = this.data.babyInfo;
    
    // 简单的表单验证
    if (!name.trim()) {
      wx.showToast({
        title: '请输入宝宝姓名',
        icon: 'none'
      });
      return;
    }
    
    if (!gender) {
      wx.showToast({
        title: '请选择性别',
        icon: 'none'
      });
      return;
    }
    
    if (!birthday) {
      wx.showToast({
        title: '请选择出生日期',
        icon: 'none'
      });
      return;
    }
    
    // 验证描述字数
    if (description && description.length > 300) {
      wx.showToast({
        title: '描述不能超过300字',
        icon: 'none'
      });
      return;
    }
    
    // 这里可以添加保存宝宝信息的逻辑
    wx.showToast({
      title: '添加成功',
      icon: 'success',
      duration: 2000,
      success: () => {
        // 返回上一页并刷新
        setTimeout(() => {
          wx.navigateBack();
        }, 2000);
      }
    });
  },
  
  onCancel() {
    wx.navigateBack();
  }
});