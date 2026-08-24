import numpy as np
from PIL import Image
import glob, os, shutil

HERE=os.path.dirname(os.path.abspath(__file__))
BAK="/tmp/obj_originals"
os.makedirs(BAK, exist_ok=True)

def neighbors(y,x,h,w):
    for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
        ny,nx=y+dy,x+dx
        if 0<=ny<h and 0<=nx<w: yield ny,nx

def restore(f):
    src=os.path.join(BAK,f)
    if os.path.exists(src): shutil.copy(src, f)

for f in sorted(glob.glob("*.png")):
    restore(f)
    im=Image.open(f).convert("RGBA")
    a=np.array(im); h,w,_=a.shape
    px=a.reshape(h,w,4).copy()
    alpha=px[:,:,3].astype(int)
    rgb=px[:,:,:3].astype(float)
    corners=[px[0,0],px[0,-1],px[-1,0],px[-1,-1]]
    ccol=np.array([c[:3] for c in corners],float)
    bg=ccol.mean(0)
    fr=[px[y,x,3] for y in range(h) for x in range(w) if (x<3 or y<3 or x>=w-3 or y>=h-3)]
    frame_a=np.median(fr)
    mx=rgb.max(-1); mn=rgb.min(-1); sat=(mx-mn)
    d=np.sqrt(((rgb-bg)**2).sum(-1))

    transparent_mode = frame_a < 30
    if transparent_mode:
        # 已透明：仅清半透明灰边（不吃不透明暗色主体）
        isbg=(alpha<25)|((alpha<140)&(sat<45))
    else:
        # 半透明/不透明灰蒙层：低饱和灰 = 背景；彩色主体（高饱和）保留
        isbg=sat<45

    mark=np.zeros((h,w),bool); stack=[]
    for x in range(w):
        for yy in (0,h-1):
            if isbg[yy,x] and not mark[yy,x]: stack.append((yy,x))
    for y in range(h):
        for xx in (0,w-1):
            if isbg[y,xx] and not mark[y,xx]: stack.append((y,xx))
    while stack:
        y,x=stack.pop()
        if mark[y,x]: continue
        mark[y,x]=True
        for ny,nx in neighbors(y,x,h,w):
            if not mark[ny,nx] and isbg[ny,nx]: stack.append((ny,nx))
    alpha[mark]=0

    if not transparent_mode:
        rem=isbg&(alpha>0)
        visited=np.zeros((h,w),bool)
        for y in range(h):
            for x in range(w):
                if rem[y,x] and not visited[y,x]:
                    comp=[]; st=[(y,x)]; visited[y,x]=True
                    while st:
                        cy,cx=st.pop(); comp.append((cy,cx))
                        for ny,nx in neighbors(cy,cx,h,w):
                            if rem[ny,nx] and not visited[ny,nx]:
                                visited[ny,nx]=True; st.append((ny,nx))
                    if len(comp)<25:
                        for cy,cx in comp: alpha[cy,cx]=0

    px[:,:,3]=alpha.astype(np.uint8)
    px[alpha==0,:3]=0
    Image.fromarray(px,'RGBA').save(f)
    print(f"{f:16s} mode={'transparent' if transparent_mode else 'gray-veil'} frame_a={frame_a:.0f} removed={int(mark.sum())} final_opaque={(alpha>0).mean():.2f}")
