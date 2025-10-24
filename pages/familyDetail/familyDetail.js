import api from '../../api.js';

Page({
  data: {
    isHouseholder: false, // 是否为户主
    isEditMode: false, // 是否为编辑模式
    familyInfo: {
      id: null,
      familyName: '',
      createTime: '',
      memberCount: 0
    },
    editFamilyName: '', // 编辑中的家庭名称
    members: [] // 家庭成员列表
  },

  onLoad(options) {
    const isHouseholder = options.isHouseholder === 'true';
    this.setData({
      isHouseholder: isHouseholder
    });
    
    this.loadFamilyInfo();
    
    // 如果是户主，加载成员列表
    if (isHouseholder) {
      this.loadFamilyMembers();
    }
  },

  /**
   * 加载家庭信息
   */
  async loadFamilyInfo() {
    try {
      const token = wx.getStorageSync('token');
      if (!token) {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }

      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo.homeId) {
        wx.showToast({
          title: '未找到家庭信息',
          icon: 'none'
        });
        return;
      }

      // 调用获取家庭信息的接口
      const familyInfo = await api.getFamilyInfo(token, userInfo.homeId);
      
      if (familyInfo) {
        this.setData({
          familyInfo: {
            id: familyInfo.id,
            familyName: familyInfo.homeName || '我的家庭',
            createTime: this.formatDate(familyInfo.createTime),
            memberCount: familyInfo.memberCount || 0
          },
          editFamilyName: familyInfo.homeName || '我的家庭'
        });
      }
    } catch (error) {
      console.error('加载家庭信息失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  /**
   * 格式化日期
   */
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * 加载家庭成员列表
   */
  async loadFamilyMembers() {
    try {
      const token = wx.getStorageSync('token');
      if (!token) {
        return;
      }

      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo.homeId) {
        return;
      }

      // 调用获取家庭成员列表的接口
      const members = await api.getFamilyMembers(token, userInfo.homeId);
      
      if (members && members.length > 0) {
        this.setData({
          members: members
        });
      }
    } catch (error) {
      console.error('加载家庭成员失败:', error);
    }
  },

  /**
   * 点击编辑按钮
   */
  onEdit() {
    this.setData({
      isEditMode: true,
      editFamilyName: this.data.familyInfo.familyName
    });
  },

  /**
   * 家庭名称输入
   */
  onFamilyNameInput(e) {
    this.setData({
      editFamilyName: e.detail.value
    });
  },

  /**
   * 取消编辑
   */
  onCancelEdit() {
    this.setData({
      isEditMode: false,
      editFamilyName: this.data.familyInfo.familyName
    });
  },

  /**
   * 保存家庭信息
   */
  async onSave() {
    const { editFamilyName, familyInfo } = this.data;

    if (!editFamilyName || !editFamilyName.trim()) {
      wx.showToast({
        title: '请输入家庭名称',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({
        title: '保存中...',
        mask: true
      });

      const token = wx.getStorageSync('token');
      await api.updateFamilyInfo(token, familyInfo.id, editFamilyName.trim());

      wx.hideLoading();
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });

      // 更新显示的家庭名称
      this.setData({
        'familyInfo.familyName': editFamilyName.trim(),
        isEditMode: false
      });

    } catch (error) {
      wx.hideLoading();
      console.error('保存家庭信息失败:', error);
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    }
  }
});

