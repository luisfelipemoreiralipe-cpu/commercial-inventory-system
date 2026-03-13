const establishmentRepo = require('../repositories/establishmentRepository');

const getOrganizationEstablishments = async (organizationId) => {

    const establishments = await establishmentRepo.findByOrganization(organizationId);

    return establishments;
};

module.exports = {
    getOrganizationEstablishments
};