const { Connection, PublicKey } = require('@solana/web3.js');
const fetch = require('node-fetch');

async function deepAnalyzeWallet() {
  try {
    const userAddress = 'ANoP4oDmG3pNCrTkS49bjCbbMK5mxAwdST8wBLKD5wsa';
    const connection = new Connection('https://api.mainnet-beta.solana.com');
    
    console.log(`Deep analyzing wallet: ${userAddress}`);
    
    // 1. Buscar TODOS os token accounts
    console.log('\n1. Getting ALL token accounts...');
    const publicKey = new PublicKey(userAddress);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    );
    
    console.log(`Found ${tokenAccounts.value.length} token accounts`);
    
    // 2. Analisar cada token account
    const positionCandidates = [];
    const nftCandidates = [];
    
    for (const account of tokenAccounts.value) {
      const mint = account.account.data.parsed.info.mint;
      const amount = account.account.data.parsed.info.tokenAmount.uiAmountString;
      const decimals = account.account.data.parsed.info.tokenAmount.decimals;
      
      // NFTs (decimals = 0, amount = 1)
      if (decimals === 0 && amount === '1') {
        nftCandidates.push(mint);
      }
      
      // Tokens com quantidade > 0
      if (parseFloat(amount) > 0) {
        positionCandidates.push({ mint, amount, decimals });
      }
    }
    
    console.log(`Found ${nftCandidates.length} NFT candidates`);
    console.log(`Found ${positionCandidates.length} token candidates`);
    
    // 3. Testar cada NFT se é posição Meteora
    console.log('\n3. Testing NFTs for Meteora positions...');
    const meteoraPositions = [];
    
    for (const nft of nftCandidates) {
      try {
        const posRes = await fetch(`https://dlmm-api.meteora.ag/position/${nft}`, { timeout: 5000 });
        if (posRes.ok) {
          const posData = await posRes.json();
          if (posData.owner === userAddress) {
            console.log(`✅ Found Meteora position NFT: ${nft}`);
            console.log(`   Pool: ${posData.pair_address}`);
            console.log(`   Fees claimed: ${posData.total_fee_usd_claimed || 0} USD`);
            meteoraPositions.push({ nft, data: posData });
          }
        }
      } catch (e) {
        // Não é uma posição Meteora
      }
    }
    
    // 4. Testar cada token se é posição Meteora
    console.log('\n4. Testing tokens for Meteora positions...');
    
    for (const token of positionCandidates) {
      try {
        const posRes = await fetch(`https://dlmm-api.meteora.ag/position/${token.mint}`, { timeout: 5000 });
        if (posRes.ok) {
          const posData = await posRes.json();
          if (posData.owner === userAddress) {
            console.log(`✅ Found Meteora position Token: ${token.mint}`);
            console.log(`   Amount: ${token.amount}`);
            console.log(`   Pool: ${posData.pair_address}`);
            meteoraPositions.push({ token: token.mint, data: posData });
          }
        }
      } catch (e) {
        // Não é uma posição Meteora
      }
    }
    
    // 5. Buscar via RPC program accounts
    console.log('\n5. Searching via RPC program accounts...');
    
    try {
      const METEORA_PROGRAMS = [
        'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo', // DLMM
        'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB', // Dynamic AMM
        'FbDn8NFAfCF9uN2Pqpj4jzJBBx5aZ3y2xrxAmkPLJNr4', // Outro programa Meteora
      ];
      
      for (const programId of METEORA_PROGRAMS) {
        try {
          console.log(`Checking program: ${programId}`);
          
          // Diferentes tamanhos de dados possíveis
          const dataSizes = [168, 184, 200, 216, 232];
          
          for (const dataSize of dataSizes) {
            try {
              const accounts = await connection.getProgramAccounts(
                new PublicKey(programId),
                {
                  filters: [
                    { dataSize },
                    { memcmp: { offset: 8, bytes: userAddress } }
                  ]
                }
              );
              
              if (accounts.length > 0) {
                console.log(`Found ${accounts.length} accounts with dataSize ${dataSize}`);
                
                for (const account of accounts) {
                  try {
                    const posRes = await fetch(`https://dlmm-api.meteora.ag/position/${account.pubkey.toString()}`, { timeout: 3000 });
                    if (posRes.ok) {
                      const posData = await posRes.json();
                      if (posData.owner === userAddress) {
                        console.log(`✅ Found via RPC: ${account.pubkey.toString()}`);
                        meteoraPositions.push({ rpc: account.pubkey.toString(), data: posData });
                      }
                    }
                  } catch (e) {
                    // Continua
                  }
                }
              }
            } catch (e) {
              // Tamanho não suportado
            }
          }
        } catch (e) {
          console.log(`Program ${programId} failed:`, e.message);
        }
      }
    } catch (e) {
      console.log('RPC search failed:', e.message);
    }
    
    // 6. Buscar via transações (mais amplo)
    console.log('\n6. Searching via transactions (extended)...');
    
    try {
      const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 100 });
      console.log(`Found ${signatures.length} total signatures`);
      
      const positionFromTx = new Set();
      
      for (const sig of signatures.slice(0, 50)) {
        try {
          const tx = await connection.getTransaction(sig.signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0
          });
          
          if (tx && tx.meta && !tx.meta.err) {
            const meteoraInvolved = tx.transaction.message.accountKeys.some(key => 
              key.toBase58().includes('LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo') ||
              key.toBase58().includes('Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB')
            );
            
            if (meteoraInvolved) {
              for (const account of tx.transaction.message.accountKeys) {
                const accountStr = account.toBase58();
                if (accountStr !== userAddress && accountStr.length === 44) {
                  positionFromTx.add(accountStr);
                }
              }
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      console.log(`Found ${positionFromTx.size} position candidates from transactions`);
      
      // Testar candidatos
      for (const candidate of positionFromTx) {
        try {
          const posRes = await fetch(`https://dlmm-api.meteora.ag/position/${candidate}`, { timeout: 3000 });
          if (posRes.ok) {
            const posData = await posRes.json();
            if (posData.owner === userAddress) {
              console.log(`✅ Found via TX: ${candidate}`);
              meteoraPositions.push({ tx: candidate, data: posData });
            }
          }
        } catch (e) {
          // Continua
        }
      }
    } catch (e) {
      console.log('Transaction search failed:', e.message);
    }
    
    // 7. Resumo final
    console.log(`\n=== FINAL SUMMARY ===`);
    console.log(`Total Meteora positions found: ${meteoraPositions.length}`);
    
    const uniquePositions = new Map();
    
    meteoraPositions.forEach((pos, i) => {
      const address = pos.nft || pos.token || pos.rpc || pos.tx;
      if (!uniquePositions.has(address)) {
        uniquePositions.set(address, pos.data);
        console.log(`${i + 1}. ${address}`);
        console.log(`   Pool: ${pos.data.pair_address}`);
        console.log(`   Owner: ${pos.data.owner}`);
        console.log(`   Fees: $${pos.data.total_fee_usd_claimed || 0}`);
      }
    });
    
    console.log(`\nUnique positions: ${uniquePositions.size}`);
    
  } catch (error) {
    console.error('Deep analysis failed:', error.message);
  }
}

deepAnalyzeWallet();