const generateHash = (length = 12) => {
  const generateRandomHash = (length) => {
    let section = "";
    while (section.length < length) {
      const randomNumber = Math.floor(Math.random() * 10);
      section += randomNumber.toString();
    }
    return section;
  };

  return generateRandomHash(length);
};

module.exports = generateHash;
