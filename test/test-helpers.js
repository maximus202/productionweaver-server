function cleanTables(db) {
    return db.raw(
        `TRUNCATE
      productionweaver_elements,
      productionweaver_scenes,
      productionweaver_productions,
      productionweaver_users
      RESTART IDENTITY CASCADE`
    )
}

module.exports = {
    cleanTables
}