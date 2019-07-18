const BN = require("bn.js");
import * as React from 'react';
import { storiesOf } from '@storybook/react';
import Reputation from '../src/components/Account/Reputation';

storiesOf('Reputation', module)
  .add('default', () => (
    <Reputation daoName="DAO Name" totalReputation={new BN(1000)} reputation={new BN(100)} />
  ))
  .add('without token symbol', () => (
    <Reputation daoName="DAO Name" totalReputation={new BN(1000)} reputation={new BN(100)} hideSymbol={true} />
  ));