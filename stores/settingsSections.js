const { React, i18n: { Messages } } = require('powercord/webpack');
const { Icons: { FontAwesome }, Text, modal: { Confirm } } = require('powercord/components');
const { open: openModal } = require('powercord/modal');

const { getSetting, toggleSetting } = powercord.api.settings._fluxProps('better-status-indicators');

function handleSettingChangeAndReload (headerText, setting) {
  return openModal(() => React.createElement(Confirm, {
    header: headerText,
    confirmText: Messages.OKAY,
    cancelText: Messages.CANCEL,
    onConfirm: () => {
      toggleSetting(setting, true);
      setTimeout(() => location.reload(), 1e3);
    }
  }, React.createElement(Text, {}, Messages.BSI_CHANGE_SETTING_MODAL_BODY)));
}

module.exports = {
  desktop: {
    name: Messages.FORM_LABEL_DESKTOP_ONLY,
    icon: 'Monitor',
    settings: {
      messageHeaders: {
        name: Messages.BSI_CLIENT_SWITCH_MESSAGE_HEADERS,
        description: '%MESSAGE_HEADERS_DESC%',
        defaultValue: false,
        type: 'switch'
      },
      membersList: {
        name: Messages.BSI_CLIENT_SWITCH_MEMBERS_LIST,
        description: '%MEMBERS_LIST_DESC%',
        defaultValue: false,
        type: 'switch'
      },
      userPopoutModal: {
        name: Messages.BSI_CLIENT_SWITCH_USER_POPOUT_MODAL,
        description: '%USER_POPOUT_MODAL_DESC%',
        defaultValue: false,
        type: 'switch'
      },
      directMessages: {
        name: Messages.BSI_CLIENT_SWITCH_DM,
        description: '%DM_DESC%',
        defaultValue: false,
        type: 'switch'
      },
      matchStatus: {
        name: Messages.BSI_CLIENT_SWITCH_MATCH_COLOR,
        description: '%MATCH_COLOR_DESC%',
        defaultValue: false,
        type: 'switch'
      },
      preserveStatus: {
        name: Messages.BSI_CLIENT_SWITCH_PRESERVE_STATUS,
        description: Messages.BSI_DESKTOP_SWITCH_PRESERVE_STATUS_DESC,
        defaultValue: false,
        type: 'switch'
      },
      universalStatus: {
        name: Messages.BSI_DESKTOP_SWITCH_UNIVERSAL_STATUS.format({
          iconHook: () => React.createElement(FontAwesome, { icon: 'universal-access-regular' })
        }),
        description: Messages.BSI_DESKTOP_SWITCH_UNIVERSAL_STATUS_DESC,
        disabled: () => getSetting('desktopPreserveStatus', false) === false,
        defaultValue: false,
        type: 'switch'
      },
      showOnSelf: {
        name: Messages.BSI_CLIENT_SWITCH_SHOW_ON_SELF,
        description: '%SHOW_ON_SELF_DESC%',
        defaultValue: false,
        type: 'switch'
      }
    }
  },
  mobile: {
    name: Messages.BSI_MOBILE,
    icon: 'MobileDevice',
    settings: {
      disabled: {
        name: Messages.BSI_MOBILE_SWITCH_DISABLE_STATUS,
        description: Messages.BSI_MOBILE_SWITCH_DISABLE_STATUS_DESC,
        onChange: handleSettingChangeAndReload.bind(this, Messages.BSI_MOBILE_DISABLE_STATUS_MODAL_HEADER, 'mobileDisabled'),
        defaultValue: false,
        type: 'switch'
      },
      preserveStatus: {
        name: Messages.BSI_CLIENT_SWITCH_PRESERVE_STATUS,
        description: Messages.BSI_MOBILE_SWITCH_PRESERVE_STATUS_DESC,
        disabled: () => getSetting('mobileDisabled', false),
        defaultValue: false,
        type: 'switch'
      },
      showOnSelf: {
        name: Messages.BSI_CLIENT_SWITCH_SHOW_ON_SELF,
        description: '%SHOW_ON_SELF_DESC%',
        disabled: () => getSetting('mobileDisabled', false) || getSetting('mobilePreserveStatus', false) === false,
        defaultValue: false,
        type: 'switch'
      },
      avatarStatus: {
        name: Messages.BSI_CLIENT_SWITCH_AVATAR_STATUS,
        description: '%AVATAR_STATUS_DESC%',
        onChange: handleSettingChangeAndReload.bind(this, Messages.BSI_MOBILE_AVATAR_STATUS_MODAL_HEADER, 'mobileAvatarStatus'),
        disabled: () => getSetting('mobileDisabled', false),
        defaultValue: true,
        type: 'switch'
      },
      matchStatus: {
        name: Messages.BSI_CLIENT_SWITCH_MATCH_COLOR,
        description: '%MATCH_COLOR_DESC%',
        disabled: () => getSetting('mobileDisabled', false) || getSetting('mobileAvatarStatus', true),
        defaultValue: false,
        type: 'switch'
      },
      messageHeaders: {
        name: Messages.BSI_CLIENT_SWITCH_MESSAGE_HEADERS,
        disabled: () => getSetting('mobileDisabled', false) || getSetting('mobileAvatarStatus', true),
        description: '%MESSAGE_HEADERS_DESC%',
        defaultValue: false,
        type: 'switch'
      },
      membersList: {
        name: Messages.BSI_CLIENT_SWITCH_MEMBERS_LIST,
        disabled: () => getSetting('mobileDisabled', false) || getSetting('mobileAvatarStatus', true),
        description: '%MEMBERS_LIST_DESC%',
        defaultValue: false,
        type: 'switch'
      },
      userPopoutModal: {
        name: Messages.BSI_CLIENT_SWITCH_USER_POPOUT_MODAL,
        disabled: () => getSetting('mobileDisabled', false) || getSetting('mobileAvatarStatus', true),
        description: '%USER_POPOUT_MODAL_DESC%',
        defaultValue: false,
        type: 'switch'
      },
      directMessages: {
        name: Messages.BSI_CLIENT_SWITCH_DM,
        disabled: () => getSetting('mobileDisabled', false) || getSetting('mobileAvatarStatus', true),
        description: '%DM_DESC%',
        defaultValue: false,
        type: 'switch'
      }
    }
  },
  web: {
    name: Messages.BSI_WEB,
    icon: 'Public',
    settings: {
      messageHeaders: {
        name: Messages.BSI_CLIENT_SWITCH_MESSAGE_HEADERS,
        description: '%MESSAGE_HEADERS_DESC%',
        defaultValue: false,
        type: 'switch'
      },
      membersList: {
        name: Messages.BSI_CLIENT_SWITCH_MEMBERS_LIST,
        description: '%MEMBERS_LIST_DESC%',
        defaultValue: true,
        type: 'switch'
      },
      userPopoutModal: {
        name: Messages.BSI_CLIENT_SWITCH_USER_POPOUT_MODAL,
        description: '%USER_POPOUT_MODAL_DESC%',
        defaultValue: true,
        type: 'switch'
      },
      directMessages: {
        name: Messages.BSI_CLIENT_SWITCH_DM,
        description: '%DM_DESC%',
        defaultValue: true,
        type: 'switch'
      },
      matchStatus: {
        name: Messages.BSI_CLIENT_SWITCH_MATCH_COLOR,
        description: '%MATCH_COLOR_DESC%',
        defaultValue: false,
        type: 'switch'
      },
      preserveStatus: {
        name: Messages.BSI_CLIENT_SWITCH_PRESERVE_STATUS,
        description: Messages.BSI_DESKTOP_SWITCH_PRESERVE_STATUS_DESC,
        defaultValue: false,
        type: 'switch'
      },
      showOnSelf: {
        name: Messages.BSI_CLIENT_SWITCH_SHOW_ON_SELF,
        description: '%SHOW_ON_SELF_DESC%',
        disabled: () => getSetting('webPreserveStatus', false) === false,
        defaultValue: false,
        type: 'switch'
      },
      showOnBots: {
        name: Messages.BSI_CLIENT_SWITCH_SHOW_ON_BOTS,
        description: '%SHOW_ON_BOTS_DESC%',
        defaultValue: false,
        type: 'switch'
      }
    }
  },
  stream: {
    name: Messages.STATUS_STREAMING,
    icon: 'Activity',
    settings: {
      messageHeaders: {
        name: Messages.BSI_CLIENT_SWITCH_MESSAGE_HEADERS,
        description: '%MESSAGE_HEADERS_DESC%',
        defaultValue: true,
        type: 'switch'
      },
      membersList: {
        name: Messages.BSI_CLIENT_SWITCH_MEMBERS_LIST,
        description: '%MEMBERS_LIST_DESC%',
        defaultValue: true,
        type: 'switch'
      },
      userPopoutModal: {
        name: Messages.BSI_CLIENT_SWITCH_USER_POPOUT_MODAL,
        description: '%USER_POPOUT_MODAL_DESC%',
        defaultValue: true,
        type: 'switch'
      },
      directMessages: {
        name: Messages.BSI_CLIENT_SWITCH_DM,
        description: '%DM_DESC%',
        defaultValue: true,
        type: 'switch'
      },
      matchStatus: {
        name: Messages.BSI_CLIENT_SWITCH_MATCH_COLOR,
        description: '%MATCH_COLOR_DESC%',
        defaultValue: true,
        type: 'switch'
      },
      showOnSelf: {
        name: Messages.BSI_CLIENT_SWITCH_SHOW_ON_SELF,
        description: '%SHOW_ON_SELF_DESC%',
        defaultValue: false,
        type: 'switch'
      },
      showOnBots: {
        name: Messages.BSI_CLIENT_SWITCH_SHOW_ON_BOTS,
        description: '%SHOW_ON_BOTS_DESC%',
        defaultValue: true,
        type: 'switch'
      }
    }
  }
}
