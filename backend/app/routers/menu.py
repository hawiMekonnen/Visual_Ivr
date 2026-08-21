from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import MenuNode
from app.schemas import MenuNodeOut

router = APIRouter(prefix="/api/menu", tags=["menu"])


def _serialize_node(node: MenuNode) -> MenuNodeOut:
    """Recursively serialize a MenuNode ORM object into the Pydantic schema."""
    return MenuNodeOut(
        id=node.id,
        parent_id=node.parent_id,
        labels=node.labels,
        prompt_texts=node.prompt_texts,
        audio_url=node.audio_url,
        sort_order=node.sort_order,
        action_type=node.action_type,
        action_target=node.action_target,
        children=[_serialize_node(c) for c in sorted(node.children, key=lambda x: x.sort_order)],
    )


@router.get("/tree", response_model=list[MenuNodeOut], summary="Full menu tree")
def get_menu_tree(db: Session = Depends(get_db)):
    """
    Returns the full menu tree as nested JSON.
    Root nodes are those with parent_id=NULL.
    """
    roots = (
        db.query(MenuNode)
        .filter(MenuNode.parent_id.is_(None))
        .order_by(MenuNode.sort_order)
        .all()
    )
    return [_serialize_node(r) for r in roots]


@router.get("/node/{node_id}", response_model=MenuNodeOut, summary="Single node with children")
def get_node(node_id: int, db: Session = Depends(get_db)):
    """Returns a single node and its direct children."""
    node = db.query(MenuNode).filter(MenuNode.id == node_id).first()
    if not node:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Node not found")
    return _serialize_node(node)
