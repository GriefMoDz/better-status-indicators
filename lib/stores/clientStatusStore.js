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

const { Flux, FluxDispatcher, getModule } = require('powercord/webpack');
const { getSessions } = getModule([ 'getSessions' ], false) || {};

let currentClientStatus = Object.values(getSessions?.() || {}).reduce((sessions, session) => {
  sessions[session.clientInfo.client] = session.status;
  return sessions;
}, {});

function handleCurrentClientStatus (sessions) {
  currentClientStatus = Object.assign({}, ...sessions.map(session => ({ [session.clientInfo.client]: session.status })));
}

class ClientStatusStore extends Flux.Store {
  static STORE_ID = 'bsi-client-status-store';

  getCurrentClientStatus () {
    return currentClientStatus;
  }
}

module.exports = Flux.Store?.getAll?.().find(store => store.constructor.STORE_ID === ClientStatusStore.STORE_ID) || new ClientStatusStore(FluxDispatcher, {
  CONNECTION_OPEN: ({ sessions }) => handleCurrentClientStatus(sessions),
  SESSIONS_REPLACE: ({ sessions }) => handleCurrentClientStatus(sessions)
});
