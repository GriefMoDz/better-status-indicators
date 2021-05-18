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

const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');
const { findInReactTree } = require('powercord/util');
const { inject, uninject } = require('powercord/injector');

module.exports = {
  name: '[WIP] Radial Avatar Status',
  description: null,
  icon: 'Radial',
  settings: {},
  hidden: !0,

  async startModule (main) {
    const Tooltip = await getModuleByDisplayName('Tooltip');

    /* Avatar Radial Status */
    const { humanizeStatus } = await getModule([ 'humanizeStatus' ]);

    const statusStore = await getModule([ 'isMobileOnline' ]);
    const Avatar = await getModule([ 'AnimatedAvatar' ]);
    inject('bsi-module-radial-avatar-status', Avatar, 'default', ([ props ], res) => {
      const userId = props.userId || props.src.split('/')[4];
      const clientStatuses = userId === main.currentUserId ? main.clientStatusStore.getCurrentClientStatus() : statusStore.getState().clientStatuses[userId];
      if (!clientStatuses || !props.status || props.isTyping || props.isMobile || clientStatuses.isDesktop || clientStatuses.isWeb) {
        return res;
      }

      const foreignObject = findInReactTree(res, n => n?.type === 'foreignObject');
      foreignObject.props.mask = 'url(#svg-mask-avatar-default)';
      foreignObject.props.children.props.isSpeaking = true;

      res.props.children.props.children[0] = React.createElement(Tooltip, {
        text: props.statusTooltip ? humanizeStatus(props.status) : null,
        position: 'top'
      }, (props) => {
        Object.assign(foreignObject.props, props);

        return foreignObject;
      });

      delete res.props.children.props.children[1];

      return res;
    });
  },

  moduleWillUnload () {
    uninject('bsi-module-radial-avatar-status');
  }
};
