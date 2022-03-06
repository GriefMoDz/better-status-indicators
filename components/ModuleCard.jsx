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

const { React, getModule, getModuleByDisplayName, i18n: { Messages } } = require('powercord/webpack');
const { Card, Clickable, Flex, Text } = require('powercord/components');
const { default: Button } = getModule([ 'ButtonLink' ], false);

const Components = require('powercord/components/settings');
const Icons = require('./Icons');

const Caret = getModuleByDisplayName('Caret', false);
const FormDivider = getModuleByDisplayName('FormDivider', false);

const classes = getModule([ 'card', 'pulseBorder' ], false);
const IntegrationInfo = getModuleByDisplayName('IntegrationInfo', false) || (() => null);

class ModuleCard extends React.PureComponent {
  constructor (props) {
    super(props);

    this.main = props.main;
    this.parser = getModule([ 'parse', 'parseTopic' ], false);
    this.state = {
      expanded: false
    };
  }

  handleModuleState (state) {
    const { ModuleManager } = this.main;

    ModuleManager[state ? 'enable' : 'disable'](this.props.id);
  }

  handleExpand () {
    this.setState({ expanded: !this.state.expanded });

    if (typeof this.props.onToggleExpand === 'function') {
      this.props.onToggleExpand(this.state.expanded);
    }
  }

  renderSettings (disabled) {
    const { getSetting, toggleSetting, updateSetting } = this.props;

    const settings = Object.keys(this.props.settings);

    if (settings.length === 0) {
      const buttonColor = disabled ? 'GREEN' : 'RED';

      return <div>
        <FormDivider className={classes?.topDivider} style={{ marginBottom: 0 }} />
        <Flex style={{ padding: '5px 0' }}>
          <Text style={{ padding: 10 }}>{this.parser.parse(Messages.BSI_MODULE_SETTINGS_MISSING)}</Text>
          <Button style={{ alignSelf: 'center' }} size={Button.Sizes.SMALL} color={Button.Colors[buttonColor]} look={Button.Looks.OUTLINED} onClick={() => this.handleModuleState(disabled)}>{Messages[`BSI_MODULE_${disabled ? 'ENABLE' : 'DISABLE'}`]}</Button>
        </Flex>
      </div>;
    }

    if (disabled) {
      return <div>
        <FormDivider className={classes?.topDivider} style={{ marginBottom: 0 }} />
        <Flex style={{ padding: '5px 0' }}>
          <Text style={{ padding: 10 }}>{this.parser.parse(Messages.BSI_MODULE_SETTINGS_HIDDEN.plainFormat({}))}</Text>
          <Button style={{ alignSelf: 'center' }} size={Button.Sizes.SMALL} color={Button.Colors.GREEN} look={Button.Looks.OUTLINED} onClick={() => this.handleModuleState(true)}>{Messages.BSI_MODULE_ENABLE}</Button>
        </Flex>
      </div>;
    }

    const elements = [];

    settings.forEach(key => {
      const setting = this.props.settings[key];

      if (typeof setting === 'function') {
        return elements.push(React.createElement(setting));
      }

      switch (setting.type) {
        case 'radio':
          return elements.push(React.createElement(Components.RadioGroup, {
            options: setting.options,
            note: setting.description || '',
            value: getSetting(key, setting.defaultValue),
            onChange: (e) => updateSetting(key, e.value)
          }, setting.name));
        case 'switch':
          return elements.push(React.createElement(Components.SwitchItem, {
            note: setting.description || '',
            value: getSetting(key, setting.defaultValue),
            onChange: () => toggleSetting(key, setting.defaultValue)
          }, setting.name));
        case 'slider':
          return elements.push(React.createElement(Components.SliderInput, {
            note: setting.description || '',
            minValue: setting.minValue || 1,
            stickToMarkers: setting.stickToMarkers || false,
            markers: Array.isArray(setting.markers) ? setting.markers : [],
            defaultValue: setting.defaultValue || null,
            initialValue: getSetting(key, setting.defaultValue),
            onValueChange: (val) => updateSetting(key, Math.floor(parseInt(val))),
            onMarkerRender: setting.onMarkerRender || null,
            className: 'bsi-settings-slider'
          }, setting.name));
      }
    });

    return <div className={classes?.body}>
      <FormDivider className={classes?.topDivider} />
      {elements.length > 0 && elements.map(e => <Flex.Child>{e}</Flex.Child>)}
      <Flex direction={Flex.Direction.VERTICAL}>
        <Flex>
          <Button style={{ marginLeft: elements.length > 0 ? 'auto' : '' }} size={Button.Sizes.SMALL} color={Button.Colors.RED} look={Button.Looks.OUTLINED} onClick={() => this.handleModuleState(false)}>{Messages.BSI_MODULE_DISABLE}</Button>
        </Flex>
      </Flex>
    </div>;
  }

  render () {
    const { expanded } = this.state;

    const enabledModules = this.props.getSetting('enabledModules', []);
    const disabled = !enabledModules.includes(this.props.id);

    return [ <Flex direction={Flex.Direction.VERTICAL}>
      <Clickable className={classes?.header} aria-expanded={expanded} onClick={this.handleExpand.bind(this)}>
        <Flex align={Flex.Align.CENTER}>
          <IntegrationInfo
            name={this.props.name}
            icon={this.props.icon}
            details={[ { icon: (props) => React.createElement(Icons.Info, { ...props }), text: this.props.description } ]}
          />
          <Caret className={classes?.expandIcon} expanded={expanded} aria-hidden={true} />
        </Flex>
      </Clickable>
    </Flex>, expanded && this.renderSettings(disabled) ];
  }
}

module.exports = React.memo(props =>
  <Card editable={true} className={[ 'bsi-settings-module-card', classes?.card ].join(' ')}>
    <ModuleCard {...props} />
  </Card>
);
