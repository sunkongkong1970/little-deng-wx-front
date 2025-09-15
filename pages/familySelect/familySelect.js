Page({
  data: {
    code: '',
    canJoin: false,
    showSheet: false,
    nickname: '',
    avatarUrl: '',
    roleOptions: [],
    rolePickerValue: [],
    roleLabel: '请选择角色',
    saving: false
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
    wx.navigateTo({
      url: '/pages/roleSetting/roleSetting'
    });
  },
  openProfileSheet() {
    // 默认从微信获取昵称头像
    this.fetchDefaultProfile();
    // 拉取角色选项
    this.loadRoleOptions();
    this.setData({
      showSheet: true
    });
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
        // 远程头像下载并缓存
        if (info.avatarUrl) {
          wx.downloadFile({
            url: info.avatarUrl,
            success(d) {
              
              const temp = d.tempFilePath;
              console.log(temp)
              try {
                const fs = wx.getFileSystemManager();
                const savePath = `${wx.env.USER_DATA_PATH}/avatar_${Date.now()}.png`;
                fs.saveFileSync(temp, savePath);
                that.setData({
                  avatarUrl: savePath
                });
                wx.setStorageSync('localAvatarPath', savePath);
              } catch (err) {
                that.setData({
                  avatarUrl: temp
                });
              }
            }
          })
        }
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
            if (info.avatarUrl) {
              wx.downloadFile({
                url: info.avatarUrl,
                success(d) {
                  const temp = d.tempFilePath;
                  try {
                    const fs = wx.getFileSystemManager();
                    const savePath = `${wx.env.USER_DATA_PATH}/avatar_${Date.now()}.png`;
                    fs.saveFileSync(temp, savePath);
                    that.setData({
                      avatarUrl: savePath
                    });
                    wx.setStorageSync('localAvatarPath', savePath);
                  } catch (err) {
                    that.setData({
                      avatarUrl: temp
                    });
                  }
                }
              })
            }
          }
        })
      }
    })
  },
  // loadRoleOptions(){
  //   this.setData({
  //     roleOptions: [{ label: '爸爸', value: 'baba' }],
  //     rolePickerValue: ['baba'],
  //     roleLabel: '爸爸'
  //   });
  // },
  loadRoleOptions() {
    const api = require('../../api.js').default || require('../../api.js');
    api.getRoleOptions().then((res) => {
      console.log('getRoleOptions res:', res);
      const raw = (res && (res.data || res)) || {};
      console.log('getRoleOptions raw:', raw);
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
      console.log('getRoleOptions labels:', labels);
      this.setData({
        roleOptions: labels,
        rolePickerValue: (labels[0] ? [labels[0].value] : []),
        roleLabel: labels[0] ? labels[0].label : '请选择角色'
      }, () => {
        console.log('after setData roleOptions:', this.data.roleOptions);
        console.log('after setData rolePickerValue:', this.data.rolePickerValue);
        console.log('after setData roleLabel:', this.data.roleLabel);
        if (!this.data.roleOptions.length) {
          wx.showToast({ title: '角色数据为空', icon: 'none' });
        }
      });
      console.log(this.data.roleOptions)
      
    }).catch((err) => {
      console.error('加载失败:', err);
    })
  },
  onNicknameChange(e) {
    this.setData({
      nickname: e.detail.value || ''
    });
  },
  onRoleChange(e) {
    console.log('onRoleChange detail:', e.detail);
    const {
      value,
      label
    } = e.detail;
    this.setData({
      rolePickerValue: value,
      roleLabel: (label && label[0]) || '请选择角色'
    });
  },
  onRoleConfirm(e) {
    console.log('onRoleConfirm detail:', e.detail);
    const { value, label } = e.detail || {};
    this.setData({
      rolePickerValue: value || this.data.rolePickerValue,
      roleLabel: (label && label[0]) || this.data.roleLabel
    });
  },
  onChooseAvatar(e) {
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success(res) {
        const filePath = res.tempFiles && res.tempFiles[0] && res.tempFiles[0].tempFilePath;
        if (!filePath) return;
        // 缓存到本地
        const fs = wx.getFileSystemManager();
        const savePath = `${wx.env.USER_DATA_PATH}/avatar_${Date.now()}.png`;
        try {
          fs.saveFileSync(filePath, savePath);
          that.setData({
            avatarUrl: savePath
          });
          wx.setStorageSync('localAvatarPath', savePath);
        } catch (err) {
          that.setData({
            avatarUrl: filePath
          });
        }
      }
    })
  },
  onConfirmProfile() {
    if (this.data.saving) return;
    const roleLabel = this.data.roleLabel;
    const roleName = roleLabel || '';
    const nickname = this.data.nickname || '';
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
    this.setData({
      saving: true
    });
    const api = require('../../api.js').default || require('../../api.js');
    api.updateUser({
      userRoleName: roleName,
      userName: nickname
    }).then(() => {
      const localAvatarPath = wx.getStorageSync('localAvatarPath') || '';
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
});