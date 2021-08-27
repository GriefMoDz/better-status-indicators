/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this plugin in the file LICENSE.md.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/OSL-3.0
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade the plugin to
 * newer versions in the future. If you wish to customize the plugin for
 * your needs please document your changes and make backups before you update.
 *
 *
 * @copyright Copyright (c) 2020-2021 GriefMoDz
 * @license   OSL-3.0 (Open Software License ("OSL") v. 3.0)
 * @link      https://github.com/GriefMoDz/better-status-indicators
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const { React, getModule, i18n: { Messages } } = require('powercord/webpack');
const { findInReactTree } = require('powercord/util');
const { Module } = require('../../entities');

module.exports = class RadialStatus extends Module {
  get manifest () {
    return {
      name: '[WIP] Radial Avatar Status',
      description: 'Replaces the traditional status indicator with a border outline around the users\' avatar.',
      icon: 'Radial',
      settings: {
        'rs-avatar-inset': {
          type: 'slider',
          name: 'Avatar Inset',
          description: Messages.BSI_RADIAL_STATUS_INSET_DESC,
          defaultValue: 3,
          onMarkerRender: (val) => `${val}px`,
          minValue: 3,
          stickToMarkers: true,
          markers: [3, 4, 5, 6, 7, 8, 9, 10]
        },
        'rs-hide-speaking-ring': {
          type: 'switch',
          name: 'Hide speaking ring',
          description: "Hides the green ring around your avatar in the account container and always renders the status regardless if you're speaking or not.",
          defaultValue: false
        }
      }
    };
  }

  startModule () {
    /* Avatar Radial Status */
    const statusStore = getModule([ 'isMobileOnline' ], false);
    const statusModule = getModule([ 'getStatusMask' ], false);
    const Avatar = getModule([ 'AnimatedAvatar' ], false);
    this.inject('bsi-module-radial-avatar-status', Avatar, 'default', ([ props ], res) => {
      if (props.status) {
        res.props['data-bsi-radial-status'] = true;
      }

      const foreignObject = findInReactTree(res, n => n?.type === 'foreignObject');
      const { type: AvatarImg } = foreignObject.props.children;

      foreignObject.props.children.type = (_props) => {
        const res = AvatarImg(_props);

        if (this.plugin.settings.get('rs-hide-speaking-ring', false)) _props.isSpeaking = false;
        if (!_props.isSpeaking) {
          const inset = this.plugin.settings.get('rs-avatar-inset', 3);
          
          res.props.children.push(React.createElement('div', {
            className: 'bsi-avatarRadial',
            style: { 
              '--status-color': statusModule.getStatusColor(props.status),
              '--avatar-inset': `${props.size == 'SIZE_120' ? inset * 2.25 : props.size == 'SIZE_80' ? inset * 1.75 : inset}px`,
              '--outline-size': `${props.size == 'SIZE_120' ? 4 : props.size == 'SIZE_80' ? 3 : 2}px`
            }
          }));
        }

        return res;
      };

      if (props.isTyping || props.isMobile) {
        return res;
      }

      if (this.plugin.settings.get('enabledModules').includes('avatarStatuses')) {
        const userId = props.userId || props.src?.includes('/avatars') && props.src.match(/\/(?:avatars|users)\/(\d+)/)[1];
        const clientStatuses = userId === this.plugin.currentUserId ? this.plugin.clientStatusStore.getCurrentClientStatus() : statusStore.getState().clientStatuses[userId];

        if (!clientStatuses || clientStatuses.desktop || clientStatuses.web) {
          return res;
        }
      }

      foreignObject.props.mask = 'url(#svg-mask-avatar-default)';

      delete res.props.children.props.children[1];

      return res;
    });
  }
};
