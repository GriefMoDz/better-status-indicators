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

const { React, getModule } = require('powercord/webpack');
const { findInReactTree } = require('powercord/util');
const { Module } = require('../../entities');

module.exports = class RadialStatus extends Module {
  get manifest () {
    return {
      name: '[WIP] Radial Avatar Status',
      description: 'Replaces the traditional status indicator with a border outline around the users\' avatar.',
      icon: 'Radial',
      settings: {}
    };
  }

  async startModule () {
    /* Avatar Radial Status */
    const statusStore = await getModule([ 'isMobileOnline' ]);
    const statusModule = await getModule([ 'getStatusMask' ]);
    const Avatar = await getModule([ 'AnimatedAvatar' ]);
    this.inject('bsi-module-radial-avatar-status', Avatar, 'default', ([ props ], res) => {
      if (props.status) {
        res.props['data-bsi-radial-status'] = true;
      }

      const foreignObject = findInReactTree(res, n => n?.type === 'foreignObject');
      const { type: AvatarImg } = foreignObject.props.children;

      foreignObject.props.children.type = (_props) => {
        const res = AvatarImg(_props);

        if (!_props.isSpeaking) {
          res.props.children.push(React.createElement('div', {
            className: 'bsi-avatarRadial',
            style: { '--status-color': statusModule.getStatusColor(props.status) }
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
