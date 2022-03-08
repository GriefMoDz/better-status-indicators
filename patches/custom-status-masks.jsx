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

module.exports = (main, logger) => {
  const { getSetting } = main._settings;

  const Mask = getModule([ 'MaskLibrary' ], false);
  if (Mask === null) {
    return logger.error('Missing “MaskLibrary” module; please report this to the developer.');
  }

  const FILTERED_STATUSES = [ 'idle', 'dnd', 'offline', 'streaming' ];

  main.inject('bsi-custom-status-masks', Mask.MaskLibrary, 'type', (_, res) => {
    const masks = res.props.children;
    const statusDisplay = getSetting('statusDisplay', 'default');

    const statusMasks = masks.filter(mask => FILTERED_STATUSES.includes(mask.props.id?.split('svg-mask-status-').pop()));

    const IdleStatusMask = statusMasks.find(mask => mask.props.id === 'svg-mask-status-idle');
    const DndStatusMask = statusMasks.find(mask => mask.props.id === 'svg-mask-status-dnd');

    if (statusDisplay === 'solid') {
      for (const mask of statusMasks) {
        mask.props.children = <circle fill='white' cx='0.5' cy='0.5' r='0.5' />;
      }
    } else if (statusDisplay === 'classic') {
      IdleStatusMask.props.children[1] = <polygon fill='black' points='0.52, 0.51 0.84, 0.69 0.75, 0.81 0.37, 0.58 0.37, 0.15 0.52, 0.15' />;

      Object.assign(DndStatusMask.props.children[1].props, { height: 0.15, y: 0.45 });

      delete DndStatusMask.props.children[1].props.rx;
      delete DndStatusMask.props.children[1].props.ry;
    }

    return res;
  });
};
