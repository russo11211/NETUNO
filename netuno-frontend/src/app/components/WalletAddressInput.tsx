"use client";
import React from "react";
import { Input, Box, Text } from "@chakra-ui/react";

interface WalletAddressInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  label?: string;
  required?: boolean;
}

const WalletAddressInput: React.FC<WalletAddressInputProps> = ({
  value,
  onChange,
  error,
  label = "Wallet Address",
  required = false,
}) => {
  return (
    <Box>
      <Text mb={2} fontWeight={required ? "bold" : "normal"} color="gray.700">
        {label}{required && " *"}
      </Text>
      <Input 
        value={value} 
        onChange={onChange} 
        borderColor={error ? "red.500" : "gray.300"}
        bg="white"
        color="gray.800"
        placeholder="Cole seu endereço da carteira Solana aqui..."
        _placeholder={{ color: "gray.400" }}
        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
      />
      {error && <Text color="red.500" fontSize="sm" mt={1}>{error}</Text>}
    </Box>
  );
};

export default WalletAddressInput; 