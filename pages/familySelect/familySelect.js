const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
Page({
  data: {
    code: '',
    canJoin: false,
    showSheet: false,
    roleOptions: [],
    rolePickerValue: [],
    roleLabel: '请选择角色',
    saving: false,
    // 创建家庭模式开关与家庭名称
    createMode: false,
    familyName: '',
    editingNickname: false,
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      localAvatarUrl: defaultAvatarUrl,
      nickName: '',
    },
  },
  onLoad() {
    const cachedNickname = wx.getStorageSync('nickname') || '';
    const cachedAvatarPath = wx.getStorageSync('localAvatarPath') || wx.getStorageSync('localAvatarUrl') || wx.getStorageSync('avatarUrl') || '';
    const update = { "userInfo.nickName": cachedNickname };
    if (cachedAvatarPath) { update["userInfo.localAvatarUrl"] = cachedAvatarPath; }
    this.setData(update);
  },
  onCodeChange(e) {
    const value = e.detail.value || '';
    this.setData({
      code: value,
      canJoin: value.length >= 6
    });
  },
  onJoin() {
    this.openProfileSheet();
  },
  onAdd() {
    // 进入创建家庭模式，打开底部弹窗
    this.openProfileSheet(true);
  },
  openProfileSheet(create = false) {
    // 优先使用缓存数据，缺失时再尝试从微信拉取
    const cachedNickname = this.data.userInfo.nickName || '';
    const cachedAvatarPath = wx.getStorageSync('localAvatarPath') || this.data.userInfo.localAvatarUrl || '';
    const base = {
      showSheet: true,
      createMode: !!create
    };
    if (cachedNickname) base['userInfo.nickName'] = cachedNickname;
    if (cachedAvatarPath) base['userInfo.localAvatarUrl'] = cachedAvatarPath;
    this.setData(base, () => {
      if (!cachedNickname) {
        this.fetchDefaultProfile();
      }
    });
    // 拉取角色选项
    this.loadRoleOptions();
  },
  onSheetVisibleChange(e) {
    this.setData({
      showSheet: e.detail.visible
    });
  },
  fetchDefaultProfile() {
    const that = this;
    wx.getUserProfile ? wx.getUserProfile({
      desc: '用于完善资料',
      success(res) {
        const info = res.userInfo || {};
        that.setData({
          nickname: info.nickName || ''
        });
      },
      fail() {
        that.getSettingProfileFallback();
      }
    }) : this.getSettingProfileFallback();
  },
  getSettingProfileFallback() {
    const that = this;
    wx.getSetting({
      success() {
        wx.getUserInfo({
          success(res) {
            const info = res.userInfo || {};
            that.setData({
              nickname: info.nickName || ''
            });
          }
        })
      }
    })
  },
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
      // 根据数据条数设置首次定位：>=3 定位到第3条，否则定位到最后一条
      const len = labels.length;
      const initialIndex = len >= 3 ? 2 : (len > 0 ? len - 1 : -1);
      const initialValue = initialIndex >= 0 ? [labels[initialIndex].value] : [];
      const initialLabel = initialIndex >= 0 ? labels[initialIndex].label : '请选择角色';
      this.setData({
        roleOptions: labels,
        rolePickerValue: initialValue,
        roleLabel: initialLabel
      }, () => {
        if (!this.data.roleOptions.length) {
          wx.showToast({ title: '角色数据为空', icon: 'none' });
        }
      });
    }).catch((err) => {
    })
  },
  onNicknameChange(e) {
    this.setData({ "userInfo.nickName": e.detail.value || '' });
  },
  onNicknameTap() {
    this.setData({
      editingNickname: true
    });
  },
  onNicknameBlur() {
    this.setData({
      editingNickname: false
    });
  },
  onRoleChange(e) {
    const {
      value,
      label
    } = e.detail;
    this.setData({
      rolePickerValue: value,
      roleLabel: (label && label[0]) || '请选择角色'
    });
  },
  onFamilyNameChange(e) {
    this.setData({
      familyName: e.detail.value || ''
    });
  },
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail || {};
    if (!avatarUrl) return;
    try {
      const fs = wx.getFileSystemManager();
      const savePath = `${wx.env.USER_DATA_PATH}/avatar_${Date.now()}.png`;
      fs.saveFileSync(avatarUrl, savePath);
      this.setData({
        "userInfo.localAvatarUrl": savePath
      });
      wx.setStorageSync('localAvatarPath', savePath);
    } catch (err) {
      // 回退到临时路径也可用于展示
      this.setData({
        "userInfo.localAvatarUrl": avatarUrl
      });
      wx.setStorageSync('localAvatarPath', avatarUrl);
    }
  },

  downloadAvatar(){
    const that = this;
    const { avatarUrl } = this.data.userInfo;
    
    if (!avatarUrl) return;
    console.log(avatarUrl)
    // 处理微信头像的特殊情况：微信头像 URL 通常以 https://wx.qlogo.cn 开头
    // 1. 确保 URL 是 https 协议（微信要求）
    let safeUrl = avatarUrl.startsWith('http://') 
      ? avatarUrl.replace('http://', 'https://') 
      : avatarUrl;
    
    // 2. 微信头像可能需要添加后缀才能正常下载（部分场景）
    if (safeUrl.includes('wx.qlogo.cn') && !safeUrl.includes('/0')) {
      safeUrl += '/0'; // 添加尺寸参数，确保获取正确尺寸的头像
    }
    
    wx.downloadFile({
      url: safeUrl,
      timeout: 10000, // 增加超时时间
      success(res) {
        // 检查下载是否成功（200 为成功状态码）
        if (res.statusCode !== 200) {
          console.error('下载失败，状态码：', res.statusCode);
          wx.showToast({
            title: '头像下载失败',
            icon: 'none'
          });
          return;
        }
        
        const tempFilePath = res.tempFilePath;
        try {
          const fs = wx.getFileSystemManager();
          // 确保路径格式正确
          const savePath = `${wx.env.USER_DATA_PATH}/avatar_${Date.now()}.png`;
          
          // 保存文件到本地
          fs.saveFileSync(tempFilePath, savePath);
          
          // 验证文件是否存在
          const fileInfo = fs.statSync(savePath);
          if (fileInfo.size > 0) {
            // 更新数据和缓存
            that.setData({
              "userInfo.avatarUrl": savePath
            });
            wx.setStorageSync('avatarUrl', savePath);
            console.log('头像保存成功：', savePath);
            wx.showToast({
              title: '头像已保存',
              icon: 'success'
            });
          } else {
            console.error('保存的头像文件为空');
          }
        } catch (err) {
          console.error('保存头像失败：', err);
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          });
        }
      },
      fail(err) {
        console.error('下载头像失败：', err);
        wx.showToast({
          title: '下载失败',
          icon: 'none'
        });
      }
    });
  },
  onConfirmProfile() {
    if (this.data.saving) return;
    const roleLabel = this.data.roleLabel;
    const roleName = roleLabel || '';
    const nickname = this.data.userInfo.nickName || '';
    if (!roleName) {
      wx.showToast({
        title: '请选择角色',
        icon: 'none'
      });
      return;
    }
    if (!nickname) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }
    if (this.data.createMode && !this.data.familyName) {
      wx.showToast({
        title: '请输入家庭名称',
        icon: 'none'
      });
      return;
    }
    this.setData({
      saving: true
    });
    const api = require('../../api.js').default || require('../../api.js');
    const token = wx.getStorageSync('token') || '';
    console.log(token)
    const homeCode = this.data.code || '';
    // 创建家庭与加入家庭分支
    if (this.data.createMode) {
      // 创建家庭
      api.createHome(token, this.data.familyName).then(() => {
        const localAvatarPath = this.data.userInfo.localAvatarUrl || wx.getStorageSync('localAvatarPath') || '';
        wx.setStorageSync('profile', {
          roleName,
          nickname,
          avatarLocal: localAvatarPath,
          familyName: this.data.familyName
        });
        wx.showToast({ title: '家庭创建成功' });
        this.setData({ showSheet: false, saving: false });
        wx.navigateTo({ url: '/pages/roleSetting/roleSetting' });
      }).catch(err => {
        this.setData({ saving: false });
        wx.showToast({
          title: (err && err.message) || '创建家庭失败',
          icon: 'none'
        });
      });
    } else {
      api.userJoinHome({
        token,
        homeCode,
        userRole: roleName,
        userName: nickname
      }).then((res) => {
        if (res && typeof res.code !== 'undefined' && res.code !== 0) {
          this.setData({
            saving: false
          });
          wx.showToast({
            title: res.message || '加入失败',
            icon: 'none'
          });
          return;
        }
        const localAvatarPath = this.data.userInfo.localAvatarUrl || wx.getStorageSync('localAvatarPath') || '';
        wx.setStorageSync('profile', {
          roleName,
          nickname,
          avatarLocal: localAvatarPath
        });
        wx.showToast({
          title: '已保存'
        });
        this.setData({
          showSheet: false,
          saving: false
        });
        // 继续加入家庭流程
        wx.navigateTo({
          url: '/pages/roleSetting/roleSetting'
        });
      }).catch(err => {
        this.setData({
          saving: false
        });
        wx.showToast({
          title: (err && err.message) || '保存失败',
          icon: 'none'
        });
      });
    }
  }
});