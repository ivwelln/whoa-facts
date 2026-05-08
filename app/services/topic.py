from app.crud.topic import create_topic, list_topics, delete_topic, delete_all_topics


async def create_new_topic(db, name: str):
    return await create_topic(db, name)

async def list_all_topics(db):
    return await list_topics(db)

async def remove_topic(db, topic_id: int):
    return await delete_topic(db, topic_id)

async def remove_all_topics(db):
    return await delete_all_topics(db)