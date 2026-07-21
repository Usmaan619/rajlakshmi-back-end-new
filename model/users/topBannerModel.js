const { withConnection } = require("../../utils/helper");

// GET all 4 offers
exports.getOffers = async () => {
  return await withConnection(async (connection) => {
    const query = `
      SELECT offer_text1, offer_text2, offer_text3, offer_text4 
      FROM rajlaksmi_offers 
      ORDER BY offer_id DESC LIMIT 1
    `;
    const [rows] = await connection.execute(query);
    if (rows.length === 0) {
      return null;
    }

    // Array banao slider ke liye
    const row = rows[0];
    return [
      row.offer_text1,
      row.offer_text2,
      row.offer_text3,
      row.offer_text4,
    ].filter((text) => text && text.trim() !== ""); // Empty ko filter karo
  });
};

// UPDATE all 4 offers
exports.updateOffers = async (offerData) => {
  return await withConnection(async (connection) => {
    // First delete all existing offers to keep only the latest one
    await connection.execute("DELETE FROM rajlaksmi_offers");
    
    // Then insert the new offer
    const query = `
      INSERT INTO rajlaksmi_offers (offer_text1, offer_text2, offer_text3, offer_text4) 
      VALUES (?, ?, ?, ?) 
    `;
    const [result] = await connection.execute(query, [
      offerData.offer_text1,
      offerData.offer_text2,
      offerData.offer_text3,
      offerData.offer_text4,
    ]);
    return result.affectedRows > 0;
  });
};
