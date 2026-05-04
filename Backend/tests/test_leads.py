import pytest
from httpx import AsyncClient
from app.core.config import settings

pytestmark = pytest.mark.asyncio

async def test_create_lead(client: AsyncClient):
    response = await client.post(
        f"{settings.API_V1_STR}/leads",
        json={
            "name": "Test User",
            "phone": "1234567890",
            "budget": 100000.0,
            "location": "New York"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test User"
    assert data["status"] == "NEW"
    return data["_id"]

async def test_update_status(client: AsyncClient):
    # First create a lead
    create_response = await client.post(
        f"{settings.API_V1_STR}/leads",
        json={
            "name": "Status User",
            "phone": "9876543210",
            "budget": 50000.0,
            "location": "Boston"
        }
    )
    lead_id = create_response.json()["_id"]

    response = await client.patch(
        f"{settings.API_V1_STR}/leads/{lead_id}/status",
        json={"status": "CONTACTED"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "CONTACTED"

async def test_get_grouped_leads(client: AsyncClient):
    response = await client.get(f"{settings.API_V1_STR}/leads/grouped")
    assert response.status_code == 200
    data = response.json()
    assert "NEW" in data
    assert "CONTACTED" in data
    assert "VISIT_SCHEDULED" in data
    assert "CLOSED" in data

async def test_update_notes(client: AsyncClient):
    # First create a lead
    create_response = await client.post(
        f"{settings.API_V1_STR}/leads",
        json={
            "name": "Notes User",
            "phone": "9876543211",
            "budget": 50000.0,
            "location": "Boston"
        }
    )
    lead_id = create_response.json()["_id"]

    # Update notes
    response = await client.patch(
        f"{settings.API_V1_STR}/leads/{lead_id}/notes",
        json={"notes": "Some important notes"}
    )
    assert response.status_code == 200
    assert response.json()["notes"] == "Some important notes"

async def test_delete_lead(client: AsyncClient):
    # First create a lead
    create_response = await client.post(
        f"{settings.API_V1_STR}/leads",
        json={
            "name": "Delete User",
            "phone": "9876543212",
            "budget": 50000.0,
            "location": "Boston"
        }
    )
    lead_id = create_response.json()["_id"]

    # Delete the lead
    delete_response = await client.delete(f"{settings.API_V1_STR}/leads/{lead_id}")
    assert delete_response.status_code == 204

    # Verify lead is not in grouped leads
    grouped_response = await client.get(f"{settings.API_V1_STR}/leads/grouped")
    all_leads = []
    for status, leads in grouped_response.json().items():
        all_leads.extend(leads)
    
    deleted_lead = next((l for l in all_leads if l["_id"] == lead_id), None)
    assert deleted_lead is None

async def test_sorting_leads(client: AsyncClient):
    # Assuming leads were created
    response = await client.get(f"{settings.API_V1_STR}/leads?sort_by=created_at&order=desc")
    assert response.status_code == 200
    data = response.json()
    if len(data) >= 2:
        # Check if sorted descending
        assert data[0]["created_at"] >= data[1]["created_at"]
