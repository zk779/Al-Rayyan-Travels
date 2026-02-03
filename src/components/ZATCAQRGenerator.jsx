// components/ZATCAQRGenerator.jsx
import React from "react";
import QRCode from "react-qr-code";

const generateZATCAQR = (data) => {
  const { sellerName, vatNumber, timestamp, totalWithVat, vatTotal } = data;
  const encoder = new TextEncoder();

  const createTLV = (tag, value) => {
    const valueBytes = encoder.encode(value);
    return new Uint8Array([tag, valueBytes.length, ...valueBytes]);
  };

  const tlvBlocks = [
    createTLV(1, sellerName.trim()),
    createTLV(2, vatNumber.trim()),
    createTLV(3, timestamp),
    createTLV(4, totalWithVat.toFixed(2)),
    createTLV(5, vatTotal.toFixed(2)),
    createTLV(6, ""),
    createTLV(7, "AA=="),
  ];

  const totalLength = tlvBlocks.reduce((acc, b) => acc + b.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  tlvBlocks.forEach((block) => {
    result.set(block, offset);
    offset += block.length;
  });

  return btoa(String.fromCharCode(...result));
};

const ZATCAQRCode = ({ invoiceData }) => {
  const qrData = generateZATCAQR(invoiceData);
  return (
    <div style={{ textAlign: "center" }}>
      <QRCode value={qrData} size={156} level="H" />
    </div>
  );
};

export default ZATCAQRCode;