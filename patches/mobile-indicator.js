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

const { getModule, i18n: { Messages } } = require('powercord/webpack');

module.exports = (main) => {
  const { getSetting } = main._settings;

  const StatusStore = getModule([ 'isMobileOnline' ], false);
  const StatusUtils = getModule([ 'humanizeStatus' ], false);
  const StatusModule = getModule([ 'getStatusMask' ], false);

  /* Override Discord's default mobile status logic */
  main.inject('bsi-override-mobile-status', StatusStore, 'isMobileOnline', function ([ userId ], res) {
    if (getSetting('mobileDisabled', false)) {
      return false;
    }

    const showOnSelf = userId === main.currentUserId && getSetting('mobileShowOnSelf', false);
    const clientStatuses = showOnSelf ? main.clientStatusStore.getCurrentClientStatus() : this.getState().clientStatuses[userId];
    if (clientStatuses?.mobile && (getSetting('mobilePreserveStatus', false) ? true : !clientStatuses.desktop)) {
      return true;
    }

    return res;
  });

  /* Replace the online mobile status text with the user's current status type */
  const getStatusTranslation = (status) => Messages[`STATUS_${status.toUpperCase()}`];

  main.inject('bsi-replace-mobile-status-text', StatusUtils, 'humanizeStatus', ([ status, isMobile ], res) => {
    if (status !== 'online' && isMobile) {
      return Messages.STATUS_ONLINE_MOBILE.replace(getStatusTranslation('online'), getStatusTranslation(status));
    }

    return res;
  });

  /* Force the mobile status indicator to display for every status type */
  main.inject('bsi-force-mobile-status-mask', StatusModule, 'getStatusMask', ([ status, isMobile, isTyping ]) => {
    if (status !== 'online' && isMobile && !isTyping) {
      status = 'online';
    }

    return [ status, isMobile, isTyping ];
  }, true);

  main.inject('bsi-force-mobile-status-size', StatusModule, 'getStatusSize', ([ size, status, isMobile, isTyping ]) => {
    if (status !== 'online' && isMobile && !isTyping) {
      status = 'online';
    }

    return [ size, status, isMobile, isTyping ];
  }, true);

  main.inject('bsi-force-mobile-status-values', StatusModule, 'getStatusValues', (args) => {
    const { status, isMobile, isTyping } = args[0];

    if (status !== 'online' && isMobile && !isTyping) {
      args[0].status = 'online';
    }

    return args;
  }, true);
};
