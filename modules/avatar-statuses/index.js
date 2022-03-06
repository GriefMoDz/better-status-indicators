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
const { Module } = require('../../lib/entities');

const Masks = require('../../components/Masks');

module.exports = class AvatarStatuses extends Module {
  get manifest () {
    return {
      name: '[WIP] Enhanced Avatar Status',
      description: 'Displays the user\'s first appeared platform in replacement of the traditional status indicator.',
      icon: 'Globe',
      settings: {}
    }
  }

  startModule () {
    /* Avatar Status Masks */
    const Mask = getModule([ 'MaskLibrary' ], false);
    this.inject('bsi-module-enhanced-avatar-status-masks', Mask.MaskLibrary, 'type', (_, res) => {
      res.props.children.push(...[ React.createElement(Masks.Web), React.createElement(Masks.Desktop) ]);

      return res;
    });

    this.main.refreshMaskLibrary();

    /* Avatar Status Indicators */
    const statusStore = getModule([ 'isMobileOnline' ], false);
    const Avatar = getModule([ 'AnimatedAvatar' ], false);
    this.inject('bsi-module-enhanced-avatar-status-indicators', Avatar, 'default', ([ props ], res) => {
      const userId = props.userId || props.src?.includes('/avatars') && props.src.match(/\/(?:avatars|users)\/(\d+)/)[1];
      const clientStatuses = userId === this.main.currentUserId ? this.main.clientStatusStore.getCurrentClientStatus() : statusStore.getState().clientStatuses[userId];
      if (!clientStatuses || !props.status || props.isTyping || props.isMobile) {
        return res;
      }

      const isDesktop = clientStatuses.desktop;
      const isWeb = clientStatuses.web;

      const client = isDesktop && !isWeb ? 'desktop' : 'web';
      res.props['data-bsi-client-avatar-status'] = client;

      const tooltip = findInReactTree(res, n => n.type?.displayName === 'Tooltip');
      if (tooltip) {
        const { children } = tooltip.props;

        tooltip.props.children = (props) => {
          const res = children(props);

          res.props.children[0].props = { ...res.props.children[0].props,
            mask: `url(#svg-mask-status-online-${client})`
          };

          return res;
        };
      }

      return res;
    });
  }

  moduleWillUnload () {
    this.main.refreshMaskLibrary();
  }
};
