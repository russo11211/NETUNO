import React from 'react';
import { Stack } from '@chakra-ui/react';
import PositionItem from './PositionItem';

interface Pool {
  name?: string;
  pool_name?: string;
  baseMint?: string;
  token_a_mint?: string;
  token_a?: string;
  quoteMint?: string;
  token_b_mint?: string;
  token_b?: string;
  baseReserve?: number | string;
  reserve_a?: number | string;
  reserve0?: number | string;
  quoteReserve?: number | string;
  reserve_b?: number | string;
  reserve1?: number | string;
  lpSupply?: number | string;
  lp_total_supply?: number | string;
  lp_supply?: number | string;
}

interface Position {
  mint: string;
  protocol: string;
  amount: string;
  pool?: Pool;
  valueUSD?: number;
}

interface PositionListProps {
  positions: Position[];
  showUSD: boolean;
}

const PositionList: React.FC<PositionListProps> = ({ positions, showUSD }) => {
  return (
    <Stack gap={4}>
      {positions.map((pos, idx) => (
        <PositionItem key={pos.mint + '-' + idx} position={pos} showUSD={showUSD} />
      ))}
    </Stack>
  );
};

export default PositionList; 