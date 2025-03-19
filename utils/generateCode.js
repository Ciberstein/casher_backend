const generateCode = () => {
  const code = Math.floor(10000 + Math.random() * 90000);

  return code;
};

module.exports = generateCode;
