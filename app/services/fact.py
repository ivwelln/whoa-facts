from app.services.claude import get_fact_from_claude

async def fetch_and_store_fact(db):
    topic = "space"  # Example topic, can be dynamic
    fact = await get_fact_from_claude(topic)
    
    # Here you would add logic to store the fact in the database using the db session
    # For example:
    # new_fact = FactModel(content=fact, topic=topic)
    # db.add(new_fact)
    # await db.commit()
    
    return fact