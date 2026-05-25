/**
 * Query OpenFDA Drug Label API to auto-fill medicine composition details
 * @param {string} medicineName - Brand name of the medicine
 * @returns {Promise<{ composition: string, genericName: string }|null>}
 */
async function fetchComposition(medicineName) {
  try {
    const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(medicineName)}"&limit=1`;
    
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const label = data.results[0];
      const genericName = label.openfda?.generic_name?.[0] || '';
      const activeIngredient = label.active_ingredient?.[0] || '';
      
      // Select best candidate for composition field
      const composition = genericName || activeIngredient || '';
      
      return {
        composition: composition.substring(0, 200), // Safety truncation
        genericName: (genericName || activeIngredient).substring(0, 100)
      };
    }
    
    return null;
  } catch (error) {
    console.error('OpenFDA API lookup error:', error.message);
    return null;
  }
}

module.exports = { fetchComposition };
