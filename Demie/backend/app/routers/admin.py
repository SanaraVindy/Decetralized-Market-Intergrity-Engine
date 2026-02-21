@router.post("/api/admin/approve-auditor")
async def approve_auditor(data: dict, session=Depends(get_db_session)):
    target_user = data.get("username")
    
    # Update the node status in the forensic index
    query = """
    MATCH (u:User {username: $username})
    SET u.status = 'ACTIVE'
    RETURN u.username as username, u.status as status
    """
    res = await session.run(query, username=target_user)
    result = await res.single()
    
    if not result:
        raise HTTPException(status_code=404, detail="AUDITOR_NOT_FOUND")
        
    return {"status": "SUCCESS", "message": f"Auditor {target_user} is now AUTHORIZED"}