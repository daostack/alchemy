const BN = require("bn.js");
import * as React from 'react';
import { storiesOf } from '@storybook/react';
import ReputationView from '../src/components/Account/ReputationView';

storiesOf('ReputationView', module)
  .add('default', () => (
    <ReputationView daoName="DAO Name" totalReputation={new BN(1000)} reputation={new BN(100)} />
  ))
  .add('without token symbol', () => (
    <ReputationView daoName="DAO Name" totalReputation={new BN(1000)} reputation={new BN(100)} hideSymbol={true} />
  ));