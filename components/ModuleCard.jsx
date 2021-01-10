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

/* eslint-disable object-property-newline */
const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');
const { Card, Clickable, Flex, Icon, Text } = require('powercord/components');

const Caret = getModuleByDisplayName('Caret', false);
const IntegrationInfo = getModuleByDisplayName('IntegrationInfo', false);
const classes = getModule([ 'card', 'pulseBorder' ], false);

class ModuleCard extends React.PureComponent {
  constructor () {
    super();

    this.parser = getModule([ 'parse', 'parseTopic' ], false);
    this.state = {
      expanded: false
    };
  }

  handleExpand () {
    this.setState({ expanded: !this.state.expanded });

    if (typeof this.props.onToggleExpand === 'function') {
      this.props.onToggleExpand(this.state.expanded);
    }
  }

  render () {
    const { expanded } = this.state;

    return [ <Flex direction={Flex.Direction.VERTICAL}>
      <Clickable className={classes.header} aria-expanded={expanded} onClick={this.handleExpand.bind(this)}>
        <Flex align={Flex.Align.CENTER}>
          <IntegrationInfo
            name={this.props.name}
            icon={this.props.icon}
            details={[ { icon: (props) => React.createElement(Icon, { name: 'Info', ...props }), text: this.props.description } ]}
          />
          <Caret className={classes.expandIcon} expanded={expanded} aria-hidden={true} />
        </Flex>
      </Clickable>
    </Flex>, expanded && <Text style={{ padding: 10 }}>{this.parser.parse('Coming Soon! :slight_smile:')}</Text> ];
  }
}

module.exports = React.memo(props =>
  <Card editable={true} className={[ 'bsi-settings-module-card', classes.card ].join(' ')}>
    <ModuleCard {...props} />
  </Card>
);
