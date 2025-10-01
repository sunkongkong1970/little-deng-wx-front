import api from '../../api.js';

const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

Page({
  data: {
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      localAvatarUrl: '',
      nickname: '未登录',
      roleName: '未知',
      isHouseholder: false
    },
    inviteCode: '',
    showEditSheet: false,
    showInviteSheet: false,
    roleOptions: [],
    rolePickerValue: [],
    roleLabel: '请选择角色',
    editingNickname: false,
    saving: false,
    generating: false
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    const token = wx.getStorageSync('token') || {};
    console.log(userInfo)
    console.log(token)
    const nickname = wx.getStorageSync('nickname') || userInfo.userName || '未登录';
    const avatarUrl = wx.getStorageSync('avatarUrl') || userInfo.avatarUrl || defaultAvatarUrl;
    const localAvatarPath = wx.getStorageSync('localAvatarPath') || '';
    const inviteCode = wx.getStorageSync('inviteCode') || '';

    this.setData({
      'userInfo.nickname': nickname,
      'userInfo.avatarUrl': avatarUrl,
      'userInfo.localAvatarUrl': localAvatarPath || avatarUrl,
      'userInfo.roleName': userInfo.userRoleName || '未知',
      'userInfo.isHouseholder': userInfo.isHouseholder || false,
      inviteCode: inviteCode
    });
  },

  // 打开编辑弹窗
  onEdit() {
    this.setData({
      showEditSheet: true
    });
    this.loadRoleOptions();
  },

  // 关闭编辑弹窗
  onEditSheetClose() {
    this.setData({
      showEditSheet: false,
      editingNickname: false
    });
  },

  // 加载角色选项
  loadRoleOptions() {
    const api = require('../../api.js').default || require('../../api.js');
    api.getRoleOptions('role').then((res) => {
      const raw = (res && (res.data || res)) || {};
      let labels = [];
      if (Array.isArray(raw)) {
        labels = raw.map((item, index) => {
          if (typeof item === 'string' || typeof item === 'number') {
            const str = String(item);
            return { label: str, value: str };
          }
          if (item && typeof item === 'object') {
            if ('label' in item && 'value' in item) {
              return { label: String(item.label), value: String(item.value) };
            }
            if ('name' in item && ('id' in item || 'value' in item || 'code' in item)) {
              const v = item.id ?? item.value ?? item.code;
              return { label: String(item.name), value: String(v) };
            }
            if ('roleName' in item && ('roleId' in item || 'id' in item)) {
              const v = item.roleId ?? item.id;
              return { label: String(item.roleName), value: String(v) };
            }
            const firstKey = Object.keys(item)[0];
            const firstVal = firstKey ? item[firstKey] : index;
            return { label: String(firstVal), value: String(firstKey ?? index) };
          }
          return { label: String(index), value: String(index) };
        });
      } else if (raw && typeof raw === 'object') {
        labels = Object.entries(raw).map(([roleId, roleName]) => ({
          label: String(roleName),
          value: String(roleId)
        }));
      }
      
      console.log('=== 角色选项详情 ===');
      labels.forEach((item, index) => {
        console.log(`索引 ${index}: label="${item.label}", value="${item.value}"`);
      });
      
      console.log('=== 角色选项加载完成 ===');
      
      // 设置初始定位到第3个选项（索引2）
      const len = labels.length;
      const initialIndex = len >= 3 ? 2 : (len > 0 ? len - 1 : -1);
      const initialValue = initialIndex >= 0 ? [labels[initialIndex].value] : [];
      const initialLabel = initialIndex >= 0 ? labels[initialIndex].label : '请选择角色';
      
      console.log(`初始定位: 索引=${initialIndex}, value=${initialValue[0]}, label=${initialLabel}`);
      
      this.setData({
        roleOptions: labels,
        rolePickerValue: initialValue,
        roleLabel: initialLabel
      }, () => {
        if (!this.data.roleOptions.length) {
          wx.showToast({ title: '角色数据为空', icon: 'none' });
        } else {
          console.log(`角色选项已加载，初始选中: ${initialLabel}`);
        }
      });
    }).catch((err) => {
      console.error('加载角色选项失败:', err);
    })
  },

  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail || {};
    if (!avatarUrl) return;
    
    try {
      const fs = wx.getFileSystemManager();
      const savePath = `${wx.env.USER_DATA_PATH}/avatar_${Date.now()}.png`;
      fs.saveFileSync(avatarUrl, savePath);
      this.setData({
        'userInfo.localAvatarUrl': savePath
      });
      wx.setStorageSync('localAvatarPath', savePath);
    } catch (err) {
      this.setData({
        'userInfo.localAvatarUrl': avatarUrl
      });
      wx.setStorageSync('localAvatarPath', avatarUrl);
    }
  },

  // 昵称输入
  onNicknameChange(e) {
    this.setData({
      'userInfo.nickname': e.detail.value || ''
    });
  },

  // 点击昵称编辑
  onNicknameTap() {
    this.setData({
      editingNickname: true
    });
  },

  // 昵称失焦
  onNicknameBlur() {
    this.setData({
      editingNickname: false
    });
  },

  // 角色选择
  onRoleChange(e) {
    const {
      value,
      label
    } = e.detail;
    
    console.log('=== 角色选择变更事件 ===');
    console.log('事件类型:', e.type);
    console.log('事件返回 - value:', value, 'label:', label);
    
    // 使用 label 来查找对应的 value（因为 label 是用户看到并选择的）
    let actualValue = value;
    let actualLabel = (label && label[0]) || '请选择角色';
    
    if (label && label[0]) {
      // 根据 label 查找对应的选项，这是用户实际选择的
      const selectedByLabel = this.data.roleOptions.find(opt => opt.label === label[0]);
      console.log('根据 label 查找到的选项:', selectedByLabel);
      
      if (selectedByLabel) {
        // 使用 label 对应的 value，而不是事件中的 value
        actualValue = [selectedByLabel.value];
        actualLabel = selectedByLabel.label;
        console.log('实际应该使用的值:', { value: actualValue, label: actualLabel });
      }
    }
    
    this.setData({
      rolePickerValue: actualValue,
      roleLabel: actualLabel
    }, () => {
      console.log('更新后 - rolePickerValue:', this.data.rolePickerValue, 'roleLabel:', this.data.roleLabel);
    });
  },

  // 保存个人信息
  async onSaveProfile() {
    if (this.data.saving) return;

    const nickname = this.data.userInfo.nickname || '';
    const roleLabel = this.data.roleLabel;

    if (!nickname) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }

    if (!roleLabel || roleLabel === '请选择角色') {
      wx.showToast({
        title: '请选择角色',
        icon: 'none'
      });
      return;
    }

    this.setData({ saving: true });

    console.log('=== 提交保存个人信息 ===');
    console.log('当前 rolePickerValue:', this.data.rolePickerValue);
    console.log('当前 roleLabel:', this.data.roleLabel);
    console.log('即将提交的角色 ID:', this.data.rolePickerValue[0]);
    console.log('显示的角色名称:', this.data.roleLabel);

    try {
      const token = wx.getStorageSync('token') || '';
      const avatarPath = this.data.userInfo.localAvatarUrl || this.data.userInfo.avatarUrl;
      let avatarBase64 = '';

      // 读取头像base64
      if (avatarPath && (avatarPath.startsWith('wxfile://') || avatarPath.startsWith(wx.env.USER_DATA_PATH))) {
        try {
          const fs = wx.getFileSystemManager();
          const fileContent = fs.readFileSync(avatarPath, 'base64');
          if (fileContent) {
            avatarBase64 = fileContent;
          }
        } catch (err) {
          console.error('读取头像文件失败:', err);
        }
      }

      // 调用更新接口（使用 userJoinHome 接口更新资料）
      console.log('调用 userJoinHome 接口，roleId:', this.data.rolePickerValue[0]);
      await api.userJoinHome(
        token,
        this.data.rolePickerValue[0],
        nickname,
        '', // homeCode为空表示不加入新家庭，只更新资料
        avatarBase64
      );

      // 更新缓存
      wx.setStorageSync('nickname', nickname);
      const userInfo = wx.getStorageSync('userInfo') || {};
      userInfo.userName = nickname;
      userInfo.roleName = roleLabel;
      wx.setStorageSync('userInfo', userInfo);

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });

      this.setData({
        saving: false,
        showEditSheet: false
      });

      // 重新加载用户信息
      this.loadUserInfo();
    } catch (err) {
      console.error('保存失败:', err);
      this.setData({ saving: false });
      wx.showToast({
        title: err.message || '保存失败',
        icon: 'none'
      });
    }
  },

  // 打开邀请码弹窗
  async onShowInviteCode() {
    // 先检查缓存中是否有邀请码
    const cachedCode = wx.getStorageSync('inviteCode');
    if (cachedCode) {
      this.setData({
        inviteCode: cachedCode,
        showInviteSheet: true
      });
    } else {
      // 没有缓存则生成新的
      await this.generateInviteCode();
    }
  },

  // 生成邀请码
  async generateInviteCode() {
    if (this.data.generating) return;

    this.setData({ generating: true });

    try {
      const token = wx.getStorageSync('token') || '';
      const code = await api.generateCode(token);
      
      // 保存到缓存
      wx.setStorageSync('inviteCode', code);
      
      this.setData({
        inviteCode: code,
        showInviteSheet: true,
        generating: false
      });

      wx.showToast({
        title: '邀请码已生成',
        icon: 'success'
      });
    } catch (err) {
      console.error('生成邀请码失败:', err);
      this.setData({ generating: false });
      wx.showToast({
        title: err.message || '生成失败',
        icon: 'none'
      });
    }
  },

  // 关闭邀请码弹窗
  onInviteSheetClose() {
    this.setData({
      showInviteSheet: false
    });
  },

  // 复制邀请码
  onCopyInviteCode() {
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        });
      }
    });
  }
});
